export interface DirectionItemsElement {
	id: number;
	name: string;
	comment?: any;
	status: string;
}

export interface Data {
	id: number;
	name: string;
	type: string;
	comment?: any;
	directionItemsElements: DirectionItemsElement[];
}

export interface RootObject {
	message: string;
	data: Data;
}