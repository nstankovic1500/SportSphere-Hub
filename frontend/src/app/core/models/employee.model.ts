import type { UserRole, UserStatus } from './user.model';

export interface EmployeeFavoriteSport {
  id: string;
  name: string;
}

export interface EmployeeProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: EmployeeFavoriteSport[];
  employeeData: {
    companyName: string;
    headOfficeAddress: string;
    registrationNumber: string;
    pib: string;
  };
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UpdateEmployeeProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  favoriteSports: string[];
  employeeData: {
    companyName: string;
    headOfficeAddress: string;
  };
}

export interface EmployeeFacility {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  hourlyPrice: number;
  images: string[];
  sports: EmployeeFavoriteSport[];
  createdAt: string;
}

export interface EmployeeOpeningHour {
  day: number;
  open: string;
  close: string;
}

export interface CreateEmployeeFacilityRequest {
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  longitude: number;
  latitude: number;
  sports: string[];
  openingHours: EmployeeOpeningHour[];
  hourlyPrice: number;
  allowedNoShows: number;
}
