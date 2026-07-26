export interface TrainerFacilitySummary {
  id: string;
  name: string;
  city: string;
}

export interface TrainerSportSummary {
  id: string;
  name: string;
}

export interface TrainerListItem {
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

export interface TrainerDetails extends TrainerListItem {
  phone: string;
  email: string;
  biography: string;
  workingHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  resources: Array<{
    id: string;
    name: string;
    type: 'outdoor' | 'indoor' | 'team_hall';
    sport: TrainerSportSummary;
  }>;
  createdAt: string;
}

export interface TrainerAvailabilityInterval {
  startTime: string;
  endTime: string;
}

export interface TrainerAvailability {
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    facilityId: string;
    facilityName: string;
  };
  resource: {
    id: string;
    name: string;
    type: 'outdoor' | 'indoor' | 'team_hall';
    sportId: string;
    sportName: string;
  };
  date: string;
  openingTime: string;
  closingTime: string;
  occupiedIntervals: TrainerAvailabilityInterval[];
}

export interface TrainerFilters {
  facilityId?: string;
  sportId?: string;
}

export interface CreateTrainingAppointmentRequest {
  trainerId: string;
  resourceId: string;
  sportId?: string;
  startTime: string;
  endTime: string;
}

export interface AthleteTrainingAppointment {
  id: string;
  trainerName: string;
  facilityName: string;
  city: string;
  resourceName: string;
  sportName: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  canCancel: boolean;
}
