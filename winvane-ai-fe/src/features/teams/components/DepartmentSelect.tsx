'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import type { ISelectOption } from '@/components/common/select.types';
import { useDepartments } from '../hooks/useDepartments';
import { useCreateDepartment } from '../hooks/useCreateDepartment';

export interface IDepartmentSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  mode?: 'filter' | 'form';
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  className?: string;
}

export function DepartmentSelect({
  value,
  onChange,
  mode = 'form',
  placeholder,
  disabled = false,
  error = false,
  id,
  className,
}: IDepartmentSelectProps) {
  const { data: departments = [], isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();

  const options: ISelectOption[] = React.useMemo(() => {
    return departments.map((dept) => ({
      value: dept.id,
      label: dept.name,
      description: dept.teamCount !== undefined ? `${dept.teamCount} team${dept.teamCount === 1 ? '' : 's'}` : undefined,
    }));
  }, [departments]);

  const handleCreate = React.useCallback(
    async (label: string): Promise<ISelectOption> => {
      const cleanName = label.trim();
      const newDept = await createDepartment.mutateAsync({ name: cleanName });
      toast.success('Department created');
      const opt: ISelectOption = {
        value: newDept.id,
        label: newDept.name,
      };
      onChange(newDept.id);
      return opt;
    },
    [createDepartment, onChange],
  );

  return (
    <SearchableSelect
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      options={options}
      onCreate={mode === 'form' ? handleCreate : undefined}
      placeholder={placeholder || (mode === 'filter' ? 'All departments' : 'Select department...')}
      searchPlaceholder="Search departments..."
      emptyText={isLoading ? 'Loading departments...' : 'No departments found.'}
      clearable
      disabled={disabled}
      error={error}
    />
  );
}

