export interface IGetAllProjectsResponse {
  id: number;
  status: string;
  comment: string | null;
  name: string;
  goalName: string | null;
  initiativeWeight: number | null;
  employeeName: string;
  date: string;
  unitName: string;
}

export interface IGetAllProjectsApiResponse {
  data: IGetAllProjectsResponse[];
  message?: string;
  status?: string;
}
