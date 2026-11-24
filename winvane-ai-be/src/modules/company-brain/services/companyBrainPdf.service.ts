import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import {
  ICompanyBrainExtractionResponse,
  IExtractedCompanyBrainCaseStudy,
  IExtractedCompanyBrainContact,
  ICompanyBrainFields,
  TExtractedCompanyBrainFields,
} from '../interfaces/companyBrain.interface';
import { isValidCompanyBrainRichTextDocument } from '../dto/companyBrainRichText.validator';

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTOR_OUTPUT_BYTES = 256 * 1024;
const MAX_EXTRACTOR_ERROR_BYTES = 4 * 1024;
const EXTRACTOR_TIMEOUT_MS = 15_000;

interface IUploadedPdfFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CompanyBrainPdfService {
  private readonly logger = new Logger(CompanyBrainPdfService.name);

  async extract(
    file: IUploadedPdfFile | undefined,
  ): Promise<ICompanyBrainExtractionResponse> {
    if (!file) {
      throw new UnprocessableEntityException(
        'Upload a PDF to extract profile details.',
      );
    }

    if (
      file.size > MAX_PDF_SIZE_BYTES ||
      !file.originalname.toLowerCase().endsWith('.pdf') ||
      !file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))
    ) {
      throw new UnprocessableEntityException(
        'The uploaded file must be a valid PDF no larger than 5 MB.',
      );
    }

    const extracted = await this.runExtractor(file.buffer);
    const foundFields =
      Object.keys(extracted.fields).length +
      extracted.contacts.length +
      extracted.caseStudies.length;
    if (foundFields === 0) {
      throw new UnprocessableEntityException(
        'No matching company profile fields were found in this PDF.',
      );
    }

    return { ...extracted, foundFields };
  }

  private runExtractor(
    pdf: Buffer,
  ): Promise<Omit<ICompanyBrainExtractionResponse, 'foundFields'>> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(
        __dirname,
        '../../../../scripts/extract_company_brain.py',
      );
      const pythonExecutable =
        process.env.PDF_PYTHON_EXECUTABLE ??
        (process.platform === 'win32' ? 'python' : 'python3');
      const processRunner = spawn(pythonExecutable, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let output = '';
      let errorOutput = '';
      let settled = false;
      const timer = setTimeout(() => {
        processRunner.kill();
        finishWithError(
          new UnprocessableEntityException(
            'PDF extraction took too long. Try a smaller or simpler PDF.',
          ),
        );
      }, EXTRACTOR_TIMEOUT_MS);

      const finishWithError = (error: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      };

      processRunner.stdout.setEncoding('utf8');
      processRunner.stdout.on('data', (chunk: string) => {
        output += chunk;
        if (Buffer.byteLength(output, 'utf8') > MAX_EXTRACTOR_OUTPUT_BYTES) {
          processRunner.kill();
          finishWithError(
            new UnprocessableEntityException(
              'The PDF contains too much text to process.',
            ),
          );
        }
      });

      processRunner.stderr.setEncoding('utf8');
      processRunner.stderr.on('data', (chunk: string) => {
        errorOutput = `${errorOutput}${chunk}`.slice(
          -MAX_EXTRACTOR_ERROR_BYTES,
        );
      });

      processRunner.on('error', (error: Error) => {
        this.logger.error(`Unable to start PDF extractor: ${error.message}`);
        finishWithError(
          new UnprocessableEntityException(
            'PDF extraction is unavailable. Contact your administrator.',
          ),
        );
      });

      processRunner.on('close', (code: number | null) => {
        if (settled) return;
        clearTimeout(timer);
        if (code !== 0) {
          this.logger.warn(
            `PDF extractor exited with code ${code}: ${errorOutput.trim()}`,
          );
          finishWithError(
            new UnprocessableEntityException(
              'This PDF could not be read. Use a text-based PDF and try again.',
            ),
          );
          return;
        }

        try {
          const parsed: unknown = JSON.parse(output);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Extractor output must be a JSON object.');
          }
          resolve(this.validateExtraction(parsed as Record<string, unknown>));
          settled = true;
        } catch (error) {
          this.logger.error(
            `Invalid PDF extractor response: ${error instanceof Error ? error.message : String(error)}`,
          );
          finishWithError(
            new UnprocessableEntityException(
              'The PDF could not be interpreted. Check the document and try again.',
            ),
          );
        }
      });

      processRunner.stdin.on('error', (error: Error) => {
        finishWithError(
          new UnprocessableEntityException(
            `Unable to process the uploaded PDF: ${error.message}`,
          ),
        );
      });
      processRunner.stdin.end(pdf);
    });
  }

  private validateExtraction(
    result: Record<string, unknown>,
  ): Omit<ICompanyBrainExtractionResponse, 'foundFields'> {
    const fields = this.validateFields(result.fields);
    const contacts = this.validateContacts(result.contacts);
    const caseStudies = this.validateCaseStudies(result.caseStudies);
    return { fields, contacts, caseStudies };
  }

  private validateContacts(value: unknown): IExtractedCompanyBrainContact[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (contact): contact is Record<string, unknown> =>
          Boolean(contact) &&
          typeof contact === 'object' &&
          !Array.isArray(contact),
      )
      .filter(
        (contact) =>
          typeof contact.name === 'string' &&
          typeof contact.workEmail === 'string' &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.workEmail),
      )
      .slice(0, 100)
      .map((contact) => ({
        name: (contact.name as string).trim().slice(0, 120),
        workEmail: (contact.workEmail as string)
          .trim()
          .toLowerCase()
          .slice(0, 254),
        contactNumber:
          typeof contact.contactNumber === 'string'
            ? contact.contactNumber.trim().slice(0, 32)
            : '',
        jobTitle:
          typeof contact.jobTitle === 'string'
            ? contact.jobTitle.trim().slice(0, 120)
            : '',
      }))
      .filter((contact) => contact.name.length > 0);
  }

  private validateCaseStudies(
    value: unknown,
  ): IExtractedCompanyBrainCaseStudy[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (caseStudy): caseStudy is Record<string, unknown> =>
          Boolean(caseStudy) &&
          typeof caseStudy === 'object' &&
          !Array.isArray(caseStudy),
      )
      .filter(
        (caseStudy) =>
          typeof caseStudy.title === 'string' &&
          isValidCompanyBrainRichTextDocument(caseStudy.content),
      )
      .slice(0, 50)
      .map((caseStudy) => ({
        title: (caseStudy.title as string).trim().slice(0, 200),
        clientName:
          typeof caseStudy.clientName === 'string'
            ? caseStudy.clientName.trim().slice(0, 160)
            : '',
        industry:
          typeof caseStudy.industry === 'string'
            ? caseStudy.industry.trim().slice(0, 120)
            : '',
        content:
          caseStudy.content as IExtractedCompanyBrainCaseStudy['content'],
      }))
      .filter((caseStudy) => caseStudy.title.length > 0);
  }

  private validateFields(value: unknown): TExtractedCompanyBrainFields {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const fields = value as Record<string, unknown>;
    const validated: TExtractedCompanyBrainFields = {};
    const listFields: Array<
      keyof Pick<
        ICompanyBrainFields,
        'techStacks' | 'industries' | 'services' | 'targetRegions'
      >
    > = ['techStacks', 'industries', 'services', 'targetRegions'];

    for (const key of listFields) {
      const items = fields[key];
      if (
        Array.isArray(items) &&
        items.every((item) => typeof item === 'string')
      ) {
        const maxLength = key === 'techStacks' ? 80 : 100;
        validated[key] = items
          .slice(0, 50)
          .map((item: string) => item.trim().slice(0, maxLength))
          .filter(Boolean);
      }
    }

    const textFieldMaxLengths: Record<
      | 'companySizeBand'
      | 'pricingRange'
      | 'pricingModel'
      | 'summary'
      | 'websiteUrl',
      number
    > = {
      companySizeBand: 80,
      pricingRange: 120,
      pricingModel: 80,
      summary: 2000,
      websiteUrl: 2048,
    };
    for (const [key, maxLength] of Object.entries(textFieldMaxLengths)) {
      const text = fields[key];
      if (typeof text === 'string' && text.trim()) {
        validated[key as keyof typeof textFieldMaxLengths] = text
          .trim()
          .slice(0, maxLength);
      }
    }
    return validated;
  }
}
