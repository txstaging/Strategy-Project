import { AbstractControl, ValidationErrors } from '@angular/forms';

// Custom validator for password strength
export function passwordStrengthValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = control.value || '';

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value);

  const valid =
    hasUpperCase &&
    hasLowerCase &&
    hasNumeric &&
    hasSpecialChar &&
    value.length >= 8;

  if (!valid) {
    return { weakPassword: true };
  }

  return null;
}
