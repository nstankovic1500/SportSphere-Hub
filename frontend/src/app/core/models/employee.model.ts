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
  description: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  hourlyPrice: number;
  allowedNoShows?: number;
  images: string[];
  openingHours?: EmployeeOpeningHour[];
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

export interface UpdateEmployeeFacilityRequest extends CreateEmployeeFacilityRequest {}

export interface EmployeeResource {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'team_hall';
  sport: EmployeeFavoriteSport;
  capacity: number;
  equipmentDescription: string;
  active: boolean;
}

export interface CreateEmployeeResourceRequest {
  name: string;
  type: 'outdoor' | 'indoor' | 'team_hall';
  sportId: string;
  capacity: number;
  equipmentDescription: string;
}

export interface UpdateEmployeeResourceRequest extends CreateEmployeeResourceRequest {
  active: boolean;
}

export interface EmployeeTrainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sports: EmployeeFavoriteSport[];
  workingHours: EmployeeOpeningHour[];
  biography?: string;
  pricePerHour: number;
  active: boolean;
  createdAt: string;
}

export interface CreateEmployeeTrainerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sports: string[];
  workingHours: EmployeeOpeningHour[];
  biography: string;
  pricePerHour: number;
}

export interface UpdateEmployeeTrainerRequest extends CreateEmployeeTrainerRequest {
  active: boolean;
}

export type EmployeeAttendanceType = 'all' | 'reservations' | 'trainings';

export interface EmployeeAttendanceItem {
  id: string;
  type: 'reservation' | 'training';
  athleteId: string;
  athleteName: string;
  resourceName: string | null;
  trainerName: string | null;
  sportName: string;
  startTime: string;
  endTime: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'attended'
    | 'no_show'
    | 'scheduled'
    | 'completed';
  canRecordAttendance: boolean;
}

export interface EmployeeAttendanceResponse {
  items: EmployeeAttendanceItem[];
}

export interface EmployeeAttendanceUpdateResponse {
  item: EmployeeAttendanceItem;
  totalNoShows?: number;
  allowedNoShows?: number;
  athleteBlockedInFacility?: boolean;
}
