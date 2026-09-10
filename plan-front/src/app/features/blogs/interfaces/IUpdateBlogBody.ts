export interface IUpdateBlogBody {
  Title: string;
  Date: string;
  Image?: string;
  Text: string;
  Status: boolean;
  Id: number;
}

export interface IUpdateBlogResponse {
  message: string;
  data: string;
}



export interface IUpdateBlogStatusResponse {
  message: string;
  data: null;
}



