export interface PlanInitiative {
  id: number;
  value: string;
}

export interface PlanGoal {
  id: number;
  name: string;
  description: string;
  indicator: string;
}

export interface Name {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface Priority {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface Duration {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface Beneficiary {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface SupervisingAuthority {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface Weight {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface Percentage {
  id: number;
  value: string;
  status: string;
  comment: string | null;
}

export interface IGetProjectByIdResponse {
  id: number;
  planInitiative: PlanInitiative;
  planGoals: PlanGoal;
  planGoalsId: number | null;
  planInitiativeId: number | null;
  startDate: string;
  endDate: string;
  name: Name;
  priority: Priority;
  duration: Duration;
  beneficiaries: Beneficiary;
  supervisingAuthority: SupervisingAuthority;
  weight: Weight;
  code: string;
  status: string;
  planId: number;
  employeeName: string | null;
  date: string | null;
  unitName: string | null;
  unitId: number;
  percentage: Percentage;
  startDateItem: Percentage | null;
  endDateItem: Percentage | null;
}
