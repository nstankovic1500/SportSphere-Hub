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

export interface FacilityRequestEmployee {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  companyName: string;
}

export interface FacilityRequestSport {
  id: string;
  name: string;
}

export interface FacilityRequestOpeningHour {
  day: number;
  open: string;
  close: string;
}

export interface FacilityRequest {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  hourlyPrice: number;
  allowedNoShows: number;
  images: string[];
  sports: FacilityRequestSport[];
  employees: FacilityRequestEmployee[];
  openingHours: FacilityRequestOpeningHour[];
  createdAt: string;
}

export interface FacilityRequestsResponseData {
  requests: FacilityRequest[];
}

export interface ResolvedFacilityRequestResponseData {
  facility: FacilityRequest;
}
