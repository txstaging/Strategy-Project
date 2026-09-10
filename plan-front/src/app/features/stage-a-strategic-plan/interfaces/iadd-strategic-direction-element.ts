export interface IAddStrategicDirectionElement {
  name: string;
  type: string;
  comment: string;
  directionItemsElements: DirectionItemsElement[];
}

export interface DirectionItemsElement {
  name: string;
  comment: string;
  status: string;
}

export enum StrategicDirectionTypeEnum {
  Message = 'Message',
  Value = 'Value',
  Vision = 'Vision',
}
