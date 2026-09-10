export interface IAddPlanGoalBody {
  name: string;
  description: string;
  indicator: string;
  analysisPoints: number[];
}

export interface Data {
  id?: any;
  name: string;
  description: string;
  indicator: string;
  analysisPoints: number[];
  status?: any;
}

export interface IAddPlanGoalResponse {
  message: string;
  data: Data;
}

export interface IDeletePlanGoalResponse {
  message: string;
  data?: any;
}
