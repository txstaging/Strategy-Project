export interface IEditAnalysis {
  id: number;
  procedures: string;
  name: string;
  impact?: number | null; // Impact is nullable, so it can be a number or null
  degreeOfCertainty?: number | null; // DegreeOfCertainty is nullable, so it can be a number or null
  reasonForReturn: string;
}
