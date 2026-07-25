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

export type {
  PendingFacilityRequest,
  PendingFacilityRequestsResponse,
  RegistratingUser,
  ResolvedFacilityRequestResponse,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
};
