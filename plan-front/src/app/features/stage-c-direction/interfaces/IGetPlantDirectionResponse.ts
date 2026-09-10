export interface DirectionItemsElement {
	id: number;
	value: string;
	comment?: any;
	status: string;
}

export interface Vision {
	id: number;
	type: number;
	status: string;
	comment?: any;
	directionItemsElements: DirectionItemsElement[];
}

export interface DirectionItemsElement {
	id: number;
	value: string;
	comment?: any;
	status: string;
}

export interface Value {
	id: number;
	type: number;
	status: string;
	comment?: any;
	directionItemsElements: DirectionItemsElement[];
}

export interface DirectionItemsElement {
	id: number;
	value: string;
	comment?: any;
	status: string;
}

export interface Message {
	id: number;
	type: number;
	status: string;
	comment?: any;
	directionItemsElements: DirectionItemsElement[];
}

export interface GetAllDirectionDtoResponse {
	vision: Vision[];
	value: Value[];
	message: Message[];
}

export interface Data {
	id: number;
	status: string;
	getAllDirectionDtoResponse: GetAllDirectionDtoResponse;
}

export interface IPlantDirectionResponse {
	message: string;
	data: Data;
}