export interface IUpdateProjectBody {
  id: number;
  name: string;
  priority: string;
  duration: string;
  beneficiaries: string;
  supervisingAuthority: string;
  weight: string;
  code: string;
  planInitiativeId: number;
  planGoalsId: number;
  startDate: string;
  endDate: string;
}
