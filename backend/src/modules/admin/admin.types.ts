import type { IEmployeeData, UserRole, UserStatus } from '../../models/User';
import type { FacilityStatus } from '../../models/Facility';

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

interface PendingFacilityRequest {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  status: FacilityStatus;
  active: boolean;
  hourlyPrice: number;
  allowedNoShows: number;
  images: string[];
  sports: Array<{
    id: string;
    name: string;
  }>;
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    companyName: string;
  }>;
  openingHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  createdAt: Date;
}

interface PendingFacilityRequestsResponse {
  requests: PendingFacilityRequest[];
}

interface ResolvedFacilityRequestResponse {
  facility: PendingFacilityRequest;
}

interface AdminUser {
  id: string;
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

interface AdminUsersResponse {
  users: AdminUser[];
}

interface UpdateAdminUserBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  favoriteSports?: string[];
  employeeData?: IEmployeeData;
}

interface ResolvedAdminUserResponse {
  user: AdminUser;
}

interface AdminTrainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  facilityId: string;
  facilityName: string;
  sports: string[];
  pricePerHour: number | null;
  active: boolean;
  createdAt: Date;
}

interface AdminTrainersResponse {
  trainers: AdminTrainer[];
}

interface ResolvedAdminTrainerResponse {
  trainer: AdminTrainer;
}

interface CreateAdminSportBody {
  name?: string;
}

interface AdminSport {
  id: string;
  name: string;
  active: boolean;
}

interface AdminSportsResponse {
  sports: AdminSport[];
}

interface ResolvedAdminSportResponse {
  sport: AdminSport;
}

export type {
  AdminSport,
  AdminSportsResponse,
  AdminTrainer,
  AdminTrainersResponse,
  AdminUser,
  AdminUsersResponse,
  CreateAdminSportBody,
  PendingFacilityRequest,
  PendingFacilityRequestsResponse,
  RegistratingUser,
  ResolvedFacilityRequestResponse,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
  ResolvedAdminSportResponse,
  ResolvedAdminTrainerResponse,
  ResolvedAdminUserResponse,
  UpdateAdminUserBody,
};
