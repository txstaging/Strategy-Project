export interface InitiativeItem {
  value: string;
  type: number;
}

export interface InitiativeKPI {
  value: string;
}

export interface IAddInitiativesBody {
  goalId: number;
  initiativeItem: InitiativeItem[];
  initiativeKPIs: InitiativeKPI[];
  name: string;
  initiativeWeight: number;
}
