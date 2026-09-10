export interface IGetCurrentPlan {
  data: {
    id: number;
    Name: string;
    date: string;
    HasItBeenReturned?: boolean;
    ReasonForReturn?: string;
    UnitsId?: number;
    isAcceptableFromGeneralManager?: boolean;
    isAcceptableFromFromTheLeader?: boolean;
    employeeName: string;
  };
}
