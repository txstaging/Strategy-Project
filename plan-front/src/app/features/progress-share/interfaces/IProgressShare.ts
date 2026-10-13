// «مشاركة نسبة الإنجاز» — a progress figure sent to chosen people.

// Mirrors ProgressScope on the server. Pinned integers.
export enum ProgressScope {
  Project = 0,
  Initiative = 1,
  Unit = 2,
}

export const PROGRESS_SCOPE_LABELS: Record<string, string> = {
  Project: 'المشروع',
  Initiative: 'المبادرة',
  Unit: 'الوحدة',
};

export function progressScopeLabel(scope: string | ProgressScope): string {
  const key = typeof scope === 'number' ? ProgressScope[scope] : scope;
  return PROGRESS_SCOPE_LABELS[key] ?? '';
}

// One shareable thing with its current figure, for the picker.
export interface IProgressOption {
  scope: ProgressScope;
  scopeId: number;
  name: string;
  percentage: number;
  unitName?: string;
  planId?: number;
}

export interface IProgressShareRecipient {
  userId: number;
  userName?: string;
  unitName?: string;
}

export interface IProgressShare {
  id: number;
  scope: 'Project' | 'Initiative' | 'Unit';
  scopeId: number;
  scopeName: string;
  percentage: number;
  livePercentage?: number | null;
  planId?: number | null;
  note?: string | null;
  createdAt?: string;
  sentByUserId: number;
  sentByName?: string;
  isMine: boolean;
  recipients: IProgressShareRecipient[];
}

export interface ICreateProgressShare {
  scope: ProgressScope;
  scopeId: number;
  note?: string | null;
  userIds: number[];
}
