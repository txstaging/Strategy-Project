import { AbstractControl, ValidationErrors } from '@angular/forms';

// Custom validator for Saudi phone numbers
export function saudiPhoneValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value || '';

  // Saudi mobile numbers start with 05 followed by 8 digits
  // Or international format +966 5 followed by 8 digits
  const validSaudiMobile =
    /^(05)[0-9]{8}$/.test(value) || /^(\+9665)[0-9]{8}$/.test(value);

  if (!validSaudiMobile && value) {
    return { invalidSaudiPhone: true };
  }

  return null;
}
