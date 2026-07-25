import type { FacilityStatus, IGeoPoint, IOpeningHour } from '../../models/Facility';
import type { ResourceType } from '../../models/Resource';
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
  description: string;
  location: IGeoPoint;
  openingHours: IOpeningHour[];
  status: FacilityStatus;
  active: boolean;
  hourlyPrice: number;
  allowedNoShows: number;
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

interface UpdateEmployeeFacilityBody {
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
}

interface EmployeeResource {
  id: string;
  name: string;
  type: ResourceType;
  sport: EmployeeFavoriteSport;
  capacity: number;
  equipmentDescription: string;
  active: boolean;
}

interface CreateEmployeeResourceBody {
  name?: string;
  type?: ResourceType;
  sportId?: string;
  capacity?: number;
  equipmentDescription?: string;
}

interface UpdateEmployeeResourceBody {
  name?: string;
  type?: ResourceType;
  sportId?: string;
  capacity?: number;
  equipmentDescription?: string;
  active?: boolean;
}

export type {
  CreateEmployeeFacilityBody,
  CreateEmployeeResourceBody,
  EmployeeFacility,
  EmployeeFavoriteSport,
  EmployeeProfile,
  EmployeeResource,
  UpdateEmployeeFacilityBody,
  UpdateEmployeeProfileBody,
  UpdateEmployeeResourceBody,
};
