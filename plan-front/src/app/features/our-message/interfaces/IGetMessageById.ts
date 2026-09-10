export interface IGetMessageById {
	id: number;
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
}

export interface IGetMessageByIdResponse {
	message: string;
	data: IGetMessageById;
}
