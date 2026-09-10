export interface IGetVisionById {
	id: number;
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
}

export interface IGetVisionByIdResponse {
	message: string;
	data: IGetVisionById;
}
