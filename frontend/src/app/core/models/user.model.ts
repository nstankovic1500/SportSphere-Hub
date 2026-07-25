export type UserRole = 'athlete' | 'employee' | 'admin';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface EmployeeData {
  companyName: string;
  headOfficeAddress: string;
  registrationNumber: string;
  pib: string;
}

export interface User {
  id?: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  profileImage?: string;
  favoriteSports?: string[];
  role: UserRole;
  status: UserStatus;
  blockedFacilities?: string[];
  employeeData?: EmployeeData;
  createdAt?: string;
}
