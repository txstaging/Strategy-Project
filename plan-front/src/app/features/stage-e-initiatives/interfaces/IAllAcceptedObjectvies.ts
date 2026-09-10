export interface IPlanInitiativeStatus {
  id: number;
  status: string;
}

export interface IAllAcceptedObjectvies {
  id: number;
  status: string;
  comment: string;
  name: string;
  goalName: string;
  initiativeWeight: number;
  employeeName: string;
  date: string;
  unitName: string;
}
