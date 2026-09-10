export interface IGetAllGoals {
	title: string;
	date: string;
	imagePath: string;
	text: string;
	status: boolean;
	id: number;
	isDeleted: boolean;
	deletedAt?: any;
	updatedAt?: any;
	createdAt: string;
}

export interface Metadata {
	currentPage: number;
	perPage: number;
	lastPage: number;
	total: number;
	from: number;
	to: number;
}

export interface IGetAllGoalsResponse {
	data: IGetAllGoals[];
	metadata: Metadata;
	status?: any;
}
