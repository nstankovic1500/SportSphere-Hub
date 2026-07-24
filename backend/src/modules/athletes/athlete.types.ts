import type { Request } from 'express';

import type { ReservationStatus } from '../../models/Reservation';
import type { FacilityStatus, IOpeningHour } from '../../models/Facility';
import type { ResourceType } from '../../models/Resource';
import type { UserRole, UserStatus } from '../../models/User';

interface AthleteFavoriteSport {
  id: string;
  name: string;
}

interface AthleteProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: AthleteFavoriteSport[];
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

interface UpdateAthleteProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  favoriteSports?: string[];
}

interface AthleteReservation {
  id: string;
  facilityName: string;
  city: string;
  resourceName: string;
  sportName: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  canCancel: boolean;
}

interface ResourceAvailability {
  resource: {
    id: string;
    name: string;
    facilityId: string;
    facilityName: string;
    sportId: string;
    sportName: string;
  };
  date: string;
  openingTime: string;
  closingTime: string;
  occupiedIntervals: Array<{
    startTime: Date;
    endTime: Date;
  }>;
}

interface CreateReservationBody {
  resourceId?: string;
  startTime?: string;
  endTime?: string;
}

interface AuthenticatedAthleteRequest extends Request {
  auth?: {
    userId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

export type {
  AthleteProfile,
  AthleteReservation,
  AthleteFavoriteSport,
  CreateReservationBody,
  AuthenticatedAthleteRequest,
  ResourceAvailability,
  UpdateAthleteProfileBody,
};
