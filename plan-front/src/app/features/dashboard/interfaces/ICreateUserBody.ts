// Interface for user creation
export interface ICreateUser {
  userName: string;
  email: string;
  // Null/omitted for RegionManager (and other roles above units).
  unitId: number | null;
  password: string;
  role: string;
  phoneNumber: string;
  rank: string;
  department: string;
  administration: string;
  modulePermissions: Record<string, string[]>;
}
