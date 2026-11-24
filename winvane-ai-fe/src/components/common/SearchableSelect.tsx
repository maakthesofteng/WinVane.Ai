'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SelectOptionItem } from './SelectOptionItem';
import { cn } from '@/lib/utils/cn';
import type { ISelectOption, ISearchableSelectProps } from './select.types';

export type { ISelectOption, ISearchableSelectProps };

export function SearchableSelect({
  value,
  onChange,
  options: staticOptions,
  loadOptions,
  selectedOptions: initialSelected = [],
  onCreate,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  clearable = false,
  disabled = false,
  error,
  id,
  className,
  'aria-label': ariaLabel,
}: ISearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [asyncOptions, setAsyncOptions] = React.useState<ISelectOption[]>([]);
  const [createdOptions, setCreatedOptions] = React.useState<ISelectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const isAsync = Boolean(loadOptions);
  const currentOptions = isAsync ? asyncOptions : (staticOptions || []);

  const optionsMap = React.useMemo(() => {
    const map = new Map<string, ISelectOption>();
    initialSelected.forEach((o) => map.set(o.value, o));
    (staticOptions || []).forEach((o) => map.set(o.value, o));
    createdOptions.forEach((o) => map.set(o.value, o));
    asyncOptions.forEach((o) => map.set(o.value, o));
    return map;
  }, [initialSelected, staticOptions, createdOptions, asyncOptions]);

  // Debounced load for async options
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

  const selectedItem = value ? optionsMap.get(value) : undefined;
  const showCreateOption =
    onCreate &&
    search.trim().length > 0 &&
    !currentOptions.some((opt) => opt.label.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (val: string) => {
    onChange(val === value && clearable ? undefined : val);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    if (!onCreate || !search.trim()) return;
    try {
      setIsLoading(true);
      const created = await onCreate(search.trim());
      setCreatedOptions((prev) => [...prev, created]);
      onChange(created.value);
      setOpen(false);
      setSearch('');
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel || placeholder}
              disabled={disabled}
              variant="outline"
              className={cn(
                'w-full justify-between font-normal text-left h-9 px-3',
                !selectedItem && 'text-muted-foreground',
                error && 'border-destructive focus-visible:ring-destructive/30'
              )}
            >
              <span className="truncate flex items-center gap-2">
                {selectedItem?.avatarText && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {selectedItem.avatarText}
                  </span>
                )}
                {selectedItem ? selectedItem.label : placeholder}
              </span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {clearable && selectedItem && !disabled && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear selection"
                    className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onChange(undefined);
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          }
        />
        <PopoverContent className="w-(--anchor-width) min-w-[220px] p-0" align="start">
          <Command shouldFilter={!isAsync}>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  Loading...
                </div>
              ) : hasError ? (
                <div className="py-6 text-center text-sm text-destructive">Failed to load options.</div>
              ) : currentOptions.length === 0 && !showCreateOption ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {showCreateOption && (
                    <CommandItem onSelect={handleCreate} className="text-primary font-medium">
                      <Plus className="mr-2 h-4 w-4" />
                      Create &quot;{search.trim()}&quot;
                    </CommandItem>
                  )}
                  {currentOptions.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      onSelect={() => handleSelect(opt.value)}
                      className="flex items-center justify-between py-2"
                    >
                      <SelectOptionItem option={opt} />
                      {value === opt.value && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
