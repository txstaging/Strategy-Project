// «المعنيون بالمبادرات والمشاريع» — read-only view of who is involved.

export interface IInitiativeStakeholders {
  initiativeId: number;
  initiativeName: string;
  unitId: number;
  unitName?: string;
  planId: number;
  planName?: string;
  goalName?: string;
  adminsInCharge: string[];
  partners: string[];
}

export interface IProjectStakeholders {
  projectId: number;
  projectName: string;
  code?: string | null;
  unitId: number;
  unitName?: string;
  planId: number;
  planName?: string;
  initiativeName?: string;
  supervisingAuthority?: string | null;
  beneficiaries?: string | null;
}

export interface IStakeholders {
  initiatives: IInitiativeStakeholders[];
  projects: IProjectStakeholders[];
}
