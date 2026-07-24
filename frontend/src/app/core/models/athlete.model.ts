import type { UserRole, UserStatus } from './user.model';

export interface AthleteFavoriteSport {
  id: string;
  name: string;
}

export interface AthleteProfile {
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
  createdAt: string;
}


export interface UpdateAthleteProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  favoriteSports: string[];
}

export interface AthleteReservation {
  id: string;
  facilityName: string;
  city: string;
  resourceName: string;
  sportName: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  canCancel: boolean;
}

export interface ResourceAvailabilityPeriod {
  startTime: string;
  endTime: string;
}

export interface ResourceDetails {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  sportId: string;
  sportName: string;
}

export interface ResourceAvailability {
  resource: ResourceDetails;
  date: string;
  openingTime: string;
  closingTime: string;
  occupiedIntervals: ResourceAvailabilityPeriod[];
}

export interface AthleteReservationRequest {
  resourceId: string;
  startTime: string;
  endTime: string;
}

export interface CreateFacilityReviewRequest {
  reaction: 'like' | 'dislike';
  comment: string;
}
