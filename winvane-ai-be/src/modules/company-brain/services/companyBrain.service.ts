import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { CompanyBrain } from '../entities/companyBrain.entity';
import { CompanyBrainCaseStudy } from '../entities/companyBrainCaseStudy.entity';
import { CompanyBrainContact } from '../entities/companyBrainContact.entity';
import { UpdateCompanyBrainDto } from '../dto/updateCompanyBrain.dto';
import type {
  ICompanyBrainCaseStudy,
  ICompanyBrainContact,
  ICompanyBrainFields,
  ICompanyBrainResponse,
} from '../interfaces/companyBrain.interface';

const EMPTY_FIELDS: ICompanyBrainFields = {
  techStacks: [],
  industries: [],
  services: [],
  targetRegions: [],
  companySizeBand: '',
  pricingRange: '',
  pricingModel: '',
  summary: '',
  websiteUrl: '',
};

function toContactResponse(contact: CompanyBrainContact): ICompanyBrainContact {
  return {
    id: contact.id,
    name: contact.name,
    workEmail: contact.workEmail,
    contactNumber: contact.contactNumber,
    jobTitle: contact.jobTitle,
  };
}

function toCaseStudyResponse(
  caseStudy: CompanyBrainCaseStudy,
): ICompanyBrainCaseStudy {
  return {
    id: caseStudy.id,
    title: caseStudy.title,
    clientName: caseStudy.clientName,
    industry: caseStudy.industry,
    content: caseStudy.content,
  };
}

function toResponse(profile: CompanyBrain): ICompanyBrainResponse {
  return {
    techStacks: profile.techStacks,
    industries: profile.industries,
    services: profile.services,
    targetRegions: profile.targetRegions,
    companySizeBand: profile.companySizeBand,
    pricingRange: profile.pricingRange,
    pricingModel: profile.pricingModel,
    summary: profile.summary,
    websiteUrl: profile.websiteUrl,
    contacts: (profile.contacts ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toContactResponse),
    caseStudies: (profile.caseStudies ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toCaseStudyResponse),
    status: profile.status,
    version: profile.version,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

@Injectable()
export class CompanyBrainService {
  constructor(
    @InjectRepository(CompanyBrain)
    private readonly companyBrainRepository: Repository<CompanyBrain>,
    private readonly dataSource: DataSource,
  ) {}

  async getProfile(workspaceId: string): Promise<ICompanyBrainResponse> {
    const profile = await this.companyBrainRepository.findOne({
      where: { workspaceId },
      relations: { contacts: true, caseStudies: true },
    });
    if (!profile) {
      return {
        ...EMPTY_FIELDS,
        contacts: [],
        caseStudies: [],
        status: 'draft',
        version: 0,
        updatedAt: null,
      };
    }
    return toResponse(profile);
  }

  async saveProfile(
    workspaceId: string,
    userId: string,
    dto: UpdateCompanyBrainDto,
  ): Promise<ICompanyBrainResponse> {
    const contactEmails = (dto.contacts ?? []).map((contact) =>
      contact.workEmail.trim().toLowerCase(),
    );
    if (new Set(contactEmails).size !== contactEmails.length) {
      throw new BadRequestException(
        'Each employee contact must have a unique work email.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const workspace = await manager.getRepository(Workspace).findOne({
        where: { id: workspaceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!workspace) {
        throw new NotFoundException('Workspace not found.');
      }

      const repository = manager.getRepository(CompanyBrain);
      const profile = await repository.findOne({
        where: { workspaceId },
        relations: { contacts: true, caseStudies: true },
      });
      const record =
        profile ?? repository.create({ workspaceId, createdById: userId });

      record.techStacks = dto.techStacks;
      record.industries = dto.industries;
      record.services = dto.services;
      record.targetRegions = dto.targetRegions;
      record.companySizeBand = dto.companySizeBand;
      record.pricingRange = dto.pricingRange;
      record.pricingModel = dto.pricingModel;
      record.summary = dto.summary;
      record.websiteUrl = dto.websiteUrl;
      record.status = dto.status;
      record.version = (profile?.version ?? 0) + 1;
      record.createdById ??= userId;
      record.updatedById = userId;

      const savedProfile = await repository.save(record);
      const contactRepository = manager.getRepository(CompanyBrainContact);
      const caseStudyRepository = manager.getRepository(CompanyBrainCaseStudy);
      let savedContacts = profile?.contacts ?? [];
      let savedCaseStudies = profile?.caseStudies ?? [];

      if (dto.contacts !== undefined) {
        await contactRepository.delete({ companyBrainId: savedProfile.id });
        savedContacts =
          dto.contacts.length > 0
            ? await contactRepository.save(
                dto.contacts.map((contact, sortOrder) =>
                  contactRepository.create({
                    companyBrainId: savedProfile.id,
                    name: contact.name,
                    workEmail: contact.workEmail,
                    contactNumber: contact.contactNumber ?? '',
                    jobTitle: contact.jobTitle ?? '',
                    sortOrder,
                  }),
                ),
              )
            : [];
      }

      if (dto.caseStudies !== undefined) {
        await caseStudyRepository.delete({ companyBrainId: savedProfile.id });
        savedCaseStudies =
          dto.caseStudies.length > 0
            ? await caseStudyRepository.save(
                dto.caseStudies.map((caseStudy, sortOrder) =>
                  caseStudyRepository.create({
                    companyBrainId: savedProfile.id,
                    title: caseStudy.title,
                    clientName: caseStudy.clientName ?? '',
                    industry: caseStudy.industry ?? '',
                    content: caseStudy.content,
                    sortOrder,
                  }),
                ),
              )
            : [];
      }

      return toResponse({
        ...savedProfile,
        contacts: savedContacts,
        caseStudies: savedCaseStudies,
      });
    });
  }
}
