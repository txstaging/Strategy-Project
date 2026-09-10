export interface IUpdateGoalBody {
  Title: string;
  Date: string;
  Image?: string;
  Text: string;
  Status: boolean;
  Id: number;
}

export interface IUpdateGoalResponse {
  message: string;
  data: string;
}



export interface IUpdateGoalStatusResponse {
  message: string;
  data: null;
}
