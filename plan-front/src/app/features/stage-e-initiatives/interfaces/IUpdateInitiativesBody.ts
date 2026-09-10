export interface Name {
  id: number;
  value: string;
  status: string;
  comment?: string;
}

export interface IInitiativeItem {
  id: number;
  value: string;
  status: string;
  comment?: string;
  type: number;
}

export interface IInitiativeKPI {
  id: number;
  value: string;
  status: string;
  comment?: string;
}

export interface IUpdateInitiativesBody {
  id: number;
  status: string;
  comment: string;
  goalId: number;
  name: Name;
  initiativeItem: IInitiativeItem[];
  initiativeKPIs: IInitiativeKPI[];
}
