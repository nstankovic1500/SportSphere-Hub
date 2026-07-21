import type { EmployeeData, User } from './user.model';

export interface RegisterEmployeeData {
  companyName: string;
  headOfficeAddress: string;
  registrationNumber: string;
  pib: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: 'athlete' | 'employee';
  favoriteSports: string[];
  employeeData?: RegisterEmployeeData;
}

export interface RegisteredUser extends User {
  phone: string;
  profileImage: string;
  favoriteSports: string[];
  employeeData?: EmployeeData;
  createdAt: string;
}

export interface RegisterResponseData {
  user: RegisteredUser;
}
