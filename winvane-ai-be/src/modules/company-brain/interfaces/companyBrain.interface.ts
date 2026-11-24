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

export interface ICompanyBrainRichTextNode {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | null>;
  marks?: Array<{
    type: string;
    attrs?: Record<string, string | number | null>;
  }>;
  content?: ICompanyBrainRichTextNode[];
}

export interface ICompanyBrainCaseStudy {
  id: string;
  title: string;
  clientName: string;
  industry: string;
  content: ICompanyBrainRichTextNode;
}

export interface ICompanyBrainResponse extends ICompanyBrainFields {
  contacts: ICompanyBrainContact[];
  caseStudies: ICompanyBrainCaseStudy[];
  status: 'draft' | 'confirmed';
  version: number;
  updatedAt: string | null;
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
  content: ICompanyBrainRichTextNode;
}

export interface ICompanyBrainExtractionResponse {
  fields: TExtractedCompanyBrainFields;
  contacts: IExtractedCompanyBrainContact[];
  caseStudies: IExtractedCompanyBrainCaseStudy[];
  foundFields: number;
}
