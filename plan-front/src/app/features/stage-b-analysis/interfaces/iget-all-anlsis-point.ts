export interface IGetAllAnlsisPoint {
  name: string;
  procedures: string;
  employeeName: string;
  id: number;
  isAcceptable?: boolean | null;
  hasItBeenReturned?: boolean | null;
  reasonForReturn?: string | null;
  impact?: number | null;
  degreeOfCertainty?: number | null;
}
