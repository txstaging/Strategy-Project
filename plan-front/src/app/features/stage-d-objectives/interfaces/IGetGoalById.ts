export interface Strength {
  id: number;
  name: string;
}

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
  strength: Strength[];
  threat: any[];
  risk: any[];
  opportunity: any[];
}

export interface IGetGoalById {
  message: string;
  data: Data;
}
