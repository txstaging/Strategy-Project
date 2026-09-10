export interface Data {
  id: number;
  planId: number;
  status: string;
  employeeName: string;
  date: string;
  unitName: string;
  unitId: number;
  name?: any;
  descripition?: any;
  indicator?: any;
  strength: any[];
  threat: any[];
  risk: any[];
  opportunity: any[];
}

export interface Metadata {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
}

export interface IGetAllPlanGoals {
  data: Data[];
  metadata: Metadata;
  status: string;
}

export interface IApprovePlanGoalStageResponse {
  message: string;
  data?: any;
}
