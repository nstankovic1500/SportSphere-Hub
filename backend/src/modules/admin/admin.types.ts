import type { IEmployeeData, UserRole, UserStatus } from '../../models/User';

interface RegistratingUser {
  id: string;
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: string[];
  role: UserRole;
  status: UserStatus;
  employeeData?: IEmployeeData;
  createdAt: Date;
}

interface PendingRegistrationsResponse {
  requests: RegistratingUser[];
}

interface ResolvedRegistrationResponse {
  user: RegistratingUser;
}

export type {
  RegistratingUser,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
};
