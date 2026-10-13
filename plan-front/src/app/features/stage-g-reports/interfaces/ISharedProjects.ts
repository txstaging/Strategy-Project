// «قائمة المشاريع المشتركة» — projects shared across departments, with each
// participant and what it commits to do.

// Mirror ContributionType and ContributionStatus on the server. Pinned.
export enum ContributionType {
  Budget = 0,
  Resources = 1,
  Execution = 2,
  Supervision = 3,
  Other = 4,
}

export enum ContributionStatus {
  Planned = 0,
  InProgress = 1,
  Done = 2,
}

export const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: ContributionType.Budget, label: 'ميزانية' },
  { value: ContributionType.Resources, label: 'موارد' },
  { value: ContributionType.Execution, label: 'تنفيذ' },
  { value: ContributionType.Supervision, label: 'إشراف' },
  { value: ContributionType.Other, label: 'أخرى' },
];

export const CONTRIBUTION_STATUSES: { value: ContributionStatus; label: string }[] = [
  { value: ContributionStatus.Planned, label: 'مخطط' },
  { value: ContributionStatus.InProgress, label: 'جارٍ' },
  { value: ContributionStatus.Done, label: 'منجز' },
];

export function contributionTypeLabel(t: ContributionType | number): string {
  return CONTRIBUTION_TYPES.find((x) => x.value === Number(t))?.label ?? '';
}

export function contributionStatusLabel(s: ContributionStatus | number): string {
  return CONTRIBUTION_STATUSES.find((x) => x.value === Number(s))?.label ?? '';
}

export interface IParticipant {
  id: number;
  unitId?: number | null;
  unitName?: string | null;
  partyName?: string | null;
  displayName: string;
  contributionType: ContributionType;
  contribution: string;
  amount?: number | null;
  status: ContributionStatus;
  notes?: string | null;
}

export interface ISharedProject {
  projectId: number;
  projectName: string;
  code?: string | null;
  unitId: number;
  unitName?: string;
  planId: number;
  planName?: string;
  percentage?: number | null;
  participants: IParticipant[];
}

export interface ISaveParticipant {
  projectId: number;
  unitId?: number | null;
  partyName?: string | null;
  contributionType: ContributionType;
  contribution: string;
  amount?: number | null;
  status: ContributionStatus;
  notes?: string | null;
}
