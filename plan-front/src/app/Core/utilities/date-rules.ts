import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Today's date as yyyy-MM-dd in the user's own timezone — the shape an
// <input type="date"> uses for its value and its min attribute.
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// «يجب الا يقبل تاريخ سابق لتاريخ اليوم»: a date may not be before today.
//
// `unchangedValue` is the date the record already had. Leaving it as it was is
// accepted even after it has passed, so a project already under way can still
// be edited. Mirrors ProjectController.ProjectDatesError on the server.
export function notBeforeToday(unchangedValue?: () => string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null;
    if (unchangedValue && value === unchangedValue()) return null;
    return value < todayIso() ? { beforeToday: true } : null;
  };
}

// The end date may not be before the start date (a group validator).
export function endNotBeforeStart(startKey = 'startDate', endKey = 'endDate'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start: string = group.get(startKey)?.value;
    const end: string = group.get(endKey)?.value;
    if (!start || !end) return null;
    return end < start ? { endBeforeStart: true } : null;
  };
}
