// «إدارة الموارد والميزانيات والعقود» — a project with what is allocated to it.

// Mirrors AllocationKind on the server. Pinned integers.
export enum AllocationKind {
  Resource = 0,
  Budget = 1,
  Contract = 2,
}

export const ALLOCATION_KINDS: { value: AllocationKind; label: string; single: string }[] = [
  { value: AllocationKind.Resource, label: 'الموارد', single: 'مورد' },
  { value: AllocationKind.Budget, label: 'الميزانيات', single: 'بند ميزانية' },
  { value: AllocationKind.Contract, label: 'العقود', single: 'عقد' },
];

export interface IAllocation {
  id: number;
  kind: AllocationKind;
  name: string;
  amount?: number | null;
  notes?: string | null;
}

export interface IProjectAllocations {
  projectId: number;
  projectName: string;
  code?: string | null;
  unitId: number;
  unitName?: string;
  planId: number;
  planName?: string;
  percentage?: number | null;
  resources: IAllocation[];
  budgets: IAllocation[];
  contracts: IAllocation[];
  budgetTotal: number;
  contractTotal: number;
}

export interface ISaveAllocation {
  projectId: number;
  kind: AllocationKind;
  name: string;
  amount?: number | null;
  notes?: string | null;
}
