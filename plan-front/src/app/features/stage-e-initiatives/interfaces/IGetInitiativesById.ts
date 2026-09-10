export interface Name {
  id: number;
  value: string;
  status: string;
  comment?: any;
  type: number;
}

export interface Goal {
  id: number;
  name: string;
  descripition: string;
  indicator: string;
}

export interface InitiativeItem {
  id: number;
  value: string;
  status: string;
  comment?: any;
  type: number;
}

export interface InitiativeKPI {
  id: number;
  value: string;
  status: string;
  comment?: any;
}

export interface IGetInitiativesById {
  id: number;
  status: string;
  comment?: any;
  name: Name;
  goal: Goal;
  planId: number;
  unitId: number;
  initiativeItem: InitiativeItem[];
  initiativeKPIs: InitiativeKPI[];
}
