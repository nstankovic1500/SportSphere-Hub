import type { FacilityStatus } from '../../models/Facility';
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
  status: FacilityStatus;
  active: boolean;
  hourlyPrice: number;
  images: string[];
  sports: EmployeeFavoriteSport[];
  createdAt: Date;
}

export type {
  EmployeeFacility,
  EmployeeFavoriteSport,
  EmployeeProfile,
  UpdateEmployeeProfileBody,
};
