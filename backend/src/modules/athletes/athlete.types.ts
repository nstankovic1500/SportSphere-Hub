import type { Request } from 'express';

import type { ReservationStatus } from '../../models/Reservation';
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
  AuthenticatedAthleteRequest,
  UpdateAthleteProfileBody,
};
