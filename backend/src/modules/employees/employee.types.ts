import type { FacilityStatus, IOpeningHour } from '../../models/Facility';
import type { UserRole, UserStatus } from '../../models/User';

interface EmployeeFavoriteSport {
  id: string;
  name: string;
}

interface EmployeeProfile {
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
  createdAt: Date;
}

interface UpdateEmployeeProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  favoriteSports?: string[];
  employeeData?: {
    companyName?: string;
    headOfficeAddress?: string;
  };
}

interface EmployeeFacility {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description?: string;
  status: FacilityStatus;
  active: boolean;
  hourlyPrice: number;
  images: string[];
  sports: EmployeeFavoriteSport[];
  createdAt: Date;
}

interface CreateEmployeeFacilityBody {
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  sports?: string[];
  openingHours?: IOpeningHour[];
  hourlyPrice?: number;
  allowedNoShows?: number;
  images?: string[];
}

export type {
  CreateEmployeeFacilityBody,
  EmployeeFacility,
  EmployeeFavoriteSport,
  EmployeeProfile,
  UpdateEmployeeProfileBody,
};
