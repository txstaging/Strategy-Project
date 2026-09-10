export interface IUpdateMessageBody {
  Title: string;
  Date: string;
  Image?: string;
  Text: string;
  Status: boolean;
  Id: number;
}

export interface IUpdateMessageResponse {
  message: string;
  data: string;
}



export interface IUpdateMessageStatusResponse {
  message: string;
  data: null;
}
