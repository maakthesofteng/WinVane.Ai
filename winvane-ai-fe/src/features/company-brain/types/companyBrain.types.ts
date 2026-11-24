import type { JSONContent } from '@tiptap/core';

export interface ICompanyBrainFields {
  techStacks: string[];
  industries: string[];
  services: string[];
  targetRegions: string[];
  companySizeBand: string;
  pricingRange: string;
  pricingModel: string;
  summary: string;
  websiteUrl: string;
}

export interface ICompanyBrainContact {
  id: string;
  name: string;
  workEmail: string;
  contactNumber: string;
  jobTitle: string;
}

export interface ICompanyBrainCaseStudy {
  id: string;
  title: string;
  clientName: string;
  industry: string;
  content: JSONContent;
}

export interface ICompanyBrain extends ICompanyBrainFields {
  contacts: ICompanyBrainContact[];
  caseStudies: ICompanyBrainCaseStudy[];
  status: 'draft' | 'confirmed';
  version: number;
  updatedAt: string | null;
}

export interface IUpdateCompanyBrainPayload extends ICompanyBrainFields {
  contacts: Array<Omit<ICompanyBrainContact, 'id'>>;
  caseStudies: Array<Omit<ICompanyBrainCaseStudy, 'id'>>;
  status: 'draft' | 'confirmed';
}

export type TExtractedCompanyBrainFields = Partial<ICompanyBrainFields>;

export interface IExtractedCompanyBrainContact {
  name: string;
  workEmail: string;
  contactNumber: string;
  jobTitle: string;
}

export interface IExtractedCompanyBrainCaseStudy {
  title: string;
  clientName: string;
  industry: string;
  content: JSONContent;
}

export interface ICompanyBrainExtraction {
  fields: TExtractedCompanyBrainFields;
  contacts: IExtractedCompanyBrainContact[];
  caseStudies: IExtractedCompanyBrainCaseStudy[];
  foundFields: number;
}
