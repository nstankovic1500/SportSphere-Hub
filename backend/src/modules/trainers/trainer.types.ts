import type { Request } from 'express';

import type { FacilityStatus, IOpeningHour } from '../../models/Facility';
import type { AppointmentStatus } from '../../models/Appointment';
import type { UserRole } from '../../models/User';

interface TrainerListQuery {
  facilityId?: string;
  sportId?: string;
}

interface TrainerSportSummary {
  id: string;
  name: string;
}

interface TrainerFacilitySummary {
  id: string;
  name: string;
  city: string;
}

interface PublicTrainerListItem {
  id: string;
  firstName: string;
  lastName: string;
  facility: TrainerFacilitySummary;
  sports: TrainerSportSummary[];
  specialization: string;
  hourlyPrice: number;
  ratingAverage: number;
  ratingCount: number;
  active: boolean;
}

interface PublicTrainerDetails extends PublicTrainerListItem {
  phone: string;
  email: string;
  biography: string;
  workingHours: IOpeningHour[];
  createdAt: Date;
}

interface TrainerAvailability {
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    facilityId: string;
    facilityName: string;
  };
  date: string;
  openingTime: string;
  closingTime: string;
  occupiedIntervals: Array<{
    startTime: Date;
    endTime: Date;
  }>;
}

interface CreateTrainingAppointmentBody {
  trainerId?: string;
  sportId?: string;
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

interface AuthenticatedAthleteRequest extends Request {
  auth?: {
    userId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

export type {
  TrainingAppointment,
  AuthenticatedAthleteRequest,
  CreateTrainingAppointmentBody,
  PublicTrainerDetails,
  PublicTrainerListItem,
  TrainerAvailability,
  TrainerFacilitySummary,
  TrainerListQuery,
  TrainerSportSummary,
};
