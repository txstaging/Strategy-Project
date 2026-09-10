export interface IAddAwarenessBody {
  Title: string;
  Date: string; // as this format 2025-05-14
  Image: string;
  Text: string;
}


export interface IAddAwarenessResponse {
  message: string;
	data: string;
}
