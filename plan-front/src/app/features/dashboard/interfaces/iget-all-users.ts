export interface IGetAllUsers {
    id: string;
  displayName: string;
  role: string;
  unitname:string;
  isActive: boolean;
}
export interface MetaDataDto {
  currentPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
  lastPage: number;
}


export interface ApiResponse<T> {
  data: T;
  metadata: MetaDataDto;
}


