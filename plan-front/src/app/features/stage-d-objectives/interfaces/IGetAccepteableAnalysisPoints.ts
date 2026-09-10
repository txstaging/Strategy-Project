export interface IStreanth {
  id: number;
  name: string;
}

export interface IRisk {
  id: number;
  name: string;
}

export interface IOpportunity {
  id: number;
  name: string;
}

export interface IThreat {
  id: number;
  name: string;
}

export interface IGetAccepteableAnalysisPoints {
  streanth: IStreanth[];
  risks: IRisk[];
  opportunities: IOpportunity[];
  threats: IThreat[];
}
