import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';

export function isE164Phone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isE164Phone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments): boolean {
          if (value === null || value === undefined || value === '') {
            return true;
          }
          if (typeof value !== 'string') {
            return false;
          }
          const trimmed = value.trim();
          if (!trimmed.startsWith('+')) {
            return false;
          }
          return isValidPhoneNumber(trimmed);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid E.164 phone number starting with +`;
        },
      },
    });
  };
}
