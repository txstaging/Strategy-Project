export interface Project {
  projectId: number;
  projectName: string;
  percentage: number | null;
  priority: string;
  startDate: string;
  endDate: string;
  code: string;
  timeLine: number | null;
  // Approval fields for percentage
  percentageItemId?: number;
  percentageStatus?: string;
  percentageComment?: string | null;
  percentageFilePath?: string | null;
}

export interface Initiative {
  initiativeId: number;
  initiativeName: string;
  initiativePercentage: number | null;
  projects: Project[];
  timeLine:number|null;
}

export interface Goal {
  goalId: number;
  goalName: string;
  goalPercentage: number | null;
  initiatives: Initiative[];
  timeLine:number|null;
}

export interface Unit {
  unitId: number;
  unitName: string;
  unitPercentage: number | null;
  goals: Goal[];
}

// The API response is an array of units
export type IGetReportsResponse = Unit[];
