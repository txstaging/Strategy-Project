export interface IGetAnalysisPoint {
  id: number;
  employeeId: number;
  unitsId: number;
  procedures: string;
  name: string;
  impact: number;
  degreeOfCertainty: number;
  reasonForReturn: string;
}
