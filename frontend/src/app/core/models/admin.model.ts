import type { EmployeeData, UserRole, UserStatus } from './user.model';

export interface RegistrationRequest {
  id: string;
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: string[];
  role: UserRole;
  status: UserStatus;
  employeeData?: EmployeeData;
  createdAt: string;
}

export interface RegistrationRequestsResponseData {
  requests: RegistrationRequest[];
}

export interface ResolvedRegistrationResponseData {
  user: RegistrationRequest;
}
