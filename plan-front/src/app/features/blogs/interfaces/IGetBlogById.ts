export interface IGetBlogById {
	id: number;
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
}

export interface IGetBlogByIdResponse {
	message: string;
	data: IGetBlogById;
}
