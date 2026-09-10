export interface IGetGoalById {
	id: number;
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
}

export interface IGetGoalByIdResponse {
	message: string;
	data: IGetGoalById;
}
