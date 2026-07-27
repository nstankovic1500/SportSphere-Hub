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
  closed: boolean;
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

export interface AthleteCartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  image: string | null;
  facility: {
    id: string;
    name: string;
    city: string;
  };
  lineTotal: number;
}

export interface AthleteCartResponseData {
  items: AthleteCartItem[];
  totalPrice: number;
}

export interface AthleteCartItemRequest {
  productId: string;
  quantity: number;
}

export interface AthleteCartQuantityRequest {
  quantity: number;
}

export interface AthleteOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface AthleteOrder {
  id: string;
  facility: {
    id: string;
    name: string;
    city: string;
  };
  items: AthleteOrderItem[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}
