export interface IUpdateVisionBody {
  Title: string;
  Date: string;
  Image?: string;
  Text: string;
  Status: boolean;
  Id: number;
}

export interface IUpdateVisionResponse {
  message: string;
  data: string;
}



export interface IUpdateVisionStatusResponse {
  message: string;
  data: null;
}
