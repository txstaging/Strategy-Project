export interface IPageTitle {
  id: number;
  key: string;
  pageName: string;
  defaultValue: string;
  currentValue: string;
}

export interface IGetAllPageTitlesResponse {
  titles: IPageTitle[];
}
