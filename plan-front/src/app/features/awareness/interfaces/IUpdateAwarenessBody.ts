export interface IUpdateAwarenessBody {
  Title: string;
  Date: string;
  Image?: string;
  Text: string;
  Status: boolean;
  Id: number;
}

export interface IUpdateAwarenessResponse {
  message: string;
  data: string;
}



export interface IUpdateAwarenessStatusResponse {
  message: string;
  data: null;
}
