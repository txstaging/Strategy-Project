export interface IGetProjectStatusResponse {
  id: number;
  name: string;
  descripition: string;
  indicator: string;
}

export interface IGetAcceptableInitiativesResponse {
  id: number;
  name: string;
  initiativeWeight: number;
  // The goal the initiative belongs to. Missing from older API builds.
  goalId?: number;
}
