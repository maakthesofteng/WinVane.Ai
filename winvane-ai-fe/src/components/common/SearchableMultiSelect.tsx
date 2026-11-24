'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { SelectOptionItem } from './SelectOptionItem';
import { MultiSelectChip } from './MultiSelectChip';
import { cn } from '@/lib/utils/cn';
import type { ISelectOption, ISearchableMultiSelectProps } from './select.types';

export type { ISelectOption, ISearchableMultiSelectProps };

export function SearchableMultiSelect({
  value = [],
  onChange,
  options: staticOptions,
  loadOptions,
  selectedOptions: initialSelected = [],
  maxSelected,
  placeholder = 'Select multiple...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  disabled = false,
  error,
  id,
  className,
  'aria-label': ariaLabel,
}: ISearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [asyncOptions, setAsyncOptions] = React.useState<ISelectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const isAsync = Boolean(loadOptions);
  const currentOptions = isAsync ? asyncOptions : (staticOptions || []);

  const optionsMap = React.useMemo(() => {
    const map = new Map<string, ISelectOption>();
    initialSelected.forEach((opt) => map.set(opt.value, opt));
    (staticOptions || []).forEach((opt) => map.set(opt.value, opt));
    asyncOptions.forEach((opt) => map.set(opt.value, opt));
    return map;
  }, [initialSelected, staticOptions, asyncOptions]);

  // Async search debounce
  React.useEffect(() => {
    if (!isAsync || !open || !loadOptions) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const results = await loadOptions(search);
        if (active) setAsyncOptions(results);
      } catch {
        if (active) setHasError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, open, isAsync, loadOptions]);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      onChange([...value, val]);
    }
  };

  const removeChip = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && value.length > 0 && !search) {
      removeChip(value[value.length - 1]);
    }
  };

  const visibleChips = value.slice(0, 6);
  const remainingCount = value.length - 6;
  const listboxId = `${id || 'multi-select'}-listbox`;

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          nativeButton={false}
          render={
            <div
              id={id}
              role="combobox"
              tabIndex={disabled ? -1 : 0}
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-label={ariaLabel || placeholder}
              onKeyDown={handleKeyDown}
              className={cn(
                'flex min-h-9 w-full flex-wrap items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                error && 'border-destructive focus-visible:ring-destructive/30'
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                {value.length === 0 ? (
                  <span className="text-muted-foreground select-none">{placeholder}</span>
                ) : (
                  <>
                    {visibleChips.map((val) => (
                      <MultiSelectChip
                        key={val}
                        value={val}
                        option={optionsMap.get(val)}
                        disabled={disabled}
                        onRemove={removeChip}
                      />
                    ))}
                    {remainingCount > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{remainingCount} more
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
            </div>
          }
        />
        <PopoverContent className="w-(--anchor-width) min-w-[220px] p-0" align="start">
          <Command shouldFilter={!isAsync}>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList id={listboxId} role="listbox">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  Loading...
                </div>
              ) : hasError ? (
                <div className="py-6 text-center text-sm text-destructive">Failed to load options.</div>
              ) : currentOptions.length === 0 ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {currentOptions.map((opt) => {
                    const isSelected = value.includes(opt.value);
                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled}
                        onSelect={() => toggleOption(opt.value)}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary',
                              isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <SelectOptionItem option={opt} />
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
