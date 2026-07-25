import type { Request } from 'express';

import type { AppointmentStatus } from '../../models/Appointment';
import type { OrderStatus } from '../../models/Order';
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

interface TrainingAppointment {
  id: string;
  trainerName: string;
  facilityName: string;
  city: string;
  sportName: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  canCancel: boolean;
}

interface CreateTrainingAppointmentBody {
  trainerId?: string;
  sportId?: string;
  startTime?: string;
  endTime?: string;
}

interface CartItemBody {
  productId?: string;
  quantity?: number;
}

interface UpdateCartItemBody {
  quantity?: number;
}

interface AthleteCartItem {
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

interface AthleteCartResponse {
  items: AthleteCartItem[];
  totalPrice: number;
}

interface AthleteOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

interface AthleteOrder {
  id: string;
  facility: {
    id: string;
    name: string;
    city: string;
  };
  items: AthleteOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
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
  TrainingAppointment,
  AthleteFavoriteSport,
  AthleteCartItem,
  AthleteCartResponse,
  AthleteOrder,
  CartItemBody,
  CreateReservationBody,
  CreateTrainingAppointmentBody,
  AuthenticatedAthleteRequest,
  ResourceAvailability,
  UpdateCartItemBody,
  UpdateAthleteProfileBody,
};
