import type { IEmployeeData, UserRole, UserStatus } from '../../models/User';

interface PendingRegistrationUser {
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
  requests: PendingRegistrationUser[];
}

interface ResolvedRegistrationResponse {
  user: PendingRegistrationUser;
}

export type {
  PendingRegistrationUser,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
};
