export interface ISelectOption {
  value: string;
  label: string;
  description?: string;
  avatarText?: string;
  disabled?: boolean;
  badge?: string;
}

export interface ISearchableSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  options?: ISelectOption[];
  loadOptions?: (search: string) => Promise<ISelectOption[]>;
  selectedOptions?: ISelectOption[];
  onCreate?: (label: string) => Promise<ISelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export interface ISearchableMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options?: ISelectOption[];
  loadOptions?: (search: string) => Promise<ISelectOption[]>;
  selectedOptions?: ISelectOption[];
  maxSelected?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}
