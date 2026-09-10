export interface IAddGoalBody {
  Title: string;
  Date: string; // as this format 2025-05-14
  Image: string;
  Text: string;
}


export interface IAddGoalResponse {
  message: string;
	data: string;
}
