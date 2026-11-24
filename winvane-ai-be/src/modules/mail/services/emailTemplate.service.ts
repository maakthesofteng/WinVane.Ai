import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import mjml from 'mjml';

export interface IEmailTemplateContext {
  [key: string]: string | number | boolean | undefined | null;
}

export interface IEmailRenderResult {
  html: string;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private static readonly templateCache = new Map<string, string>();

  /**
   * Resolves the template file location across dev, jest, and dist environments.
   */
  private static resolveTemplatePath(
    moduleName: string,
    templateName: string,
  ): string {
    const fileName = templateName.endsWith('.mjml')
      ? templateName
      : `${templateName}.mjml`;

    const candidates = [
      path.resolve(process.cwd(), 'src/templates', moduleName, fileName),
      path.resolve(
        process.cwd(),
        'winvane-ai-be/src/templates',
        moduleName,
        fileName,
      ),
      path.resolve(__dirname, '../../../templates', moduleName, fileName),
      path.resolve(__dirname, '../../templates', moduleName, fileName),
      path.resolve(__dirname, '../templates', moduleName, fileName),
      path.resolve(process.cwd(), 'dist/templates', moduleName, fileName),
      path.resolve(process.cwd(), 'dist/src/templates', moduleName, fileName),
      path.resolve(
        process.cwd(),
        'winvane-ai-be/dist/templates',
        moduleName,
        fileName,
      ),
      path.resolve(
        process.cwd(),
        'winvane-ai-be/dist/src/templates',
        moduleName,
        fileName,
      ),
      path.resolve(process.cwd(), 'templates', moduleName, fileName),
      path.resolve(
        process.cwd(),
        'winvane-ai-be/templates',
        moduleName,
        fileName,
      ),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      `MJML email template not found: "${moduleName}/${fileName}". Search paths:\n${candidates.join('\n')}`,
    );
  }

  /**
   * Loads template content from disk with in-memory caching.
   */
  public static loadTemplate(moduleName: string, templateName: string): string {
    const cacheKey = `${moduleName}:${templateName}`;
    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filePath = this.resolveTemplatePath(moduleName, templateName);
    const content = fs.readFileSync(filePath, 'utf-8');
    this.templateCache.set(cacheKey, content);
    return content;
  }

  /**
   * Replaces {{variable}} placeholders with context values.
   */
  public static interpolate(
    rawTemplate: string,
    context: IEmailTemplateContext,
  ): string {
    return rawTemplate.replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (_match: string, key: string): string => {
        const val = Object.prototype.hasOwnProperty.call(context, key)
          ? context[key]
          : undefined;
        return val !== undefined && val !== null ? String(val) : '';
      },
    );
  }

  /**
   * Renders an MJML template into responsive HTML.
   */
  public static async render(
    moduleName: string,
    templateName: string,
    context: IEmailTemplateContext,
  ): Promise<IEmailRenderResult> {
    const raw = this.loadTemplate(moduleName, templateName);
    const interpolated = this.interpolate(raw, context);

    const result = await mjml(interpolated, {
      validationLevel: 'soft',
      minify: false,
    });

    if (result.errors && result.errors.length > 0) {
      // Soft warnings logged for diagnostics
      const warnings = result.errors.map((e) => e.formattedMessage).join('; ');
      Logger.warn(
        `MJML validation warnings in ${moduleName}/${templateName}: ${warnings}`,
        'EmailTemplateService',
      );
    }

    return {
      html: result.html,
    };
  }

  /**
   * Instance method for dependency injection usage.
   */
  public async renderTemplate(
    moduleName: string,
    templateName: string,
    context: IEmailTemplateContext,
  ): Promise<IEmailRenderResult> {
    return EmailTemplateService.render(moduleName, templateName, context);
  }
}
