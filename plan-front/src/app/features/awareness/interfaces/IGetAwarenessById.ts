export interface IGetAwarenessById {
	id: number;
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
}

export interface IGetAwarenessByIdResponse {
	message: string;
	data: IGetAwarenessById;
}
