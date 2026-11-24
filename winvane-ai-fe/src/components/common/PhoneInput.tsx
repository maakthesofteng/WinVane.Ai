'use client';

import * as React from 'react';
import { parsePhoneNumberFromString, AsYouType, type CountryCode } from 'libphonenumber-js';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getCountries, getDefaultCountry, getCountryByIso, type ICountry } from '@/lib/phone/countries';
import { cn } from '@/lib/utils/cn';

export interface IPhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  error?: boolean;
  className?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  defaultCountry: customDefault,
  disabled = false,
  placeholder = 'Enter phone number',
  id,
  name,
  error = false,
  className,
}: IPhoneInputProps) {
  const allCountries = React.useMemo(() => getCountries(), []);
  const initialCountry = React.useMemo(() => {
    if (customDefault) {
      const match = getCountryByIso(customDefault);
      if (match) return match;
    }
    return getDefaultCountry();
  }, [customDefault]);

  const [selectedCountry, setSelectedCountry] = React.useState<ICountry>(initialCountry);
  const [nationalInput, setNationalInput] = React.useState('');
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [prevValue, setPrevValue] = React.useState(value);

  // Sync state during render if external value changes
  if (prevValue !== value) {
    setPrevValue(value);
    if (!value) {
      setNationalInput('');
    } else {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed) {
        if (parsed.country) {
          const countryMatch = getCountryByIso(parsed.country);
          if (countryMatch) setSelectedCountry(countryMatch);
        }
        setNationalInput(parsed.nationalNumber);
      } else {
        setNationalInput(value.replace(/^\+\d+/, ''));
      }
    }
  }

  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country);
    setPickerOpen(false);

    if (nationalInput.trim()) {
      const parsed = parsePhoneNumberFromString(nationalInput, country.iso2);
      if (parsed && parsed.isValid()) {
        onChange(parsed.format('E.164'));
      } else {
        onChange(`${country.dialCode}${nationalInput.replace(/\D/g, '')}`);
      }
    }
  };

  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const asYouType = new AsYouType(selectedCountry.iso2);
    const formatted = asYouType.input(rawVal);
    setNationalInput(formatted);

    const parsed = parsePhoneNumberFromString(formatted, selectedCountry.iso2);
    if (parsed && parsed.isValid()) {
      onChange(parsed.format('E.164'));
    } else if (rawVal.trim().length === 0) {
      onChange('');
    } else {
      const digitsOnly = rawVal.replace(/\D/g, '');
      onChange(digitsOnly ? `${selectedCountry.dialCode}${digitsOnly}` : '');
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1.5">
        {/* Country Selector Popover */}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="h-9 px-2.5 flex items-center gap-1.5 shrink-0 font-normal"
                aria-label="Select country"
              >
                <span className="text-base leading-none select-none">{selectedCountry.flag}</span>
                <span className="text-xs text-muted-foreground font-mono">{selectedCountry.dialCode}</span>
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-0.5" />
              </Button>
            }
          />
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country or code..." />
              <CommandList className="max-h-60">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {allCountries.map((c) => (
                    <CommandItem
                      key={c.iso2}
                      value={`${c.name} ${c.dialCode} ${c.iso2}`}
                      onSelect={() => handleCountrySelect(c)}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground">{c.dialCode}</span>
                        {selectedCountry.iso2 === c.iso2 && (
                          <Check className="h-3.5 w-3.5 text-primary ml-1" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* National Number Input */}
        <Input
          type="tel"
          id={id}
          name={name}
          disabled={disabled}
          placeholder={placeholder}
          value={nationalInput}
          onChange={handleNationalChange}
          className={cn(
            'flex-1 h-9',
            error && 'border-destructive focus-visible:ring-destructive/30'
          )}
        />
      </div>
    </div>
  );
}
