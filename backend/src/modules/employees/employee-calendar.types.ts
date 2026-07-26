import type { ResourceType } from '../../models/Resource';
import type { AppointmentStatus } from '../../models/Appointment';
import type { ReservationStatus } from '../../models/Reservation';

interface EmployeeCalendarQuery {
  resourceId?: string;
  start?: string;
  end?: string;
  type?: 'all' | 'reservations' | 'trainings';
}

interface MoveReservationBody {
  startTime?: string;
  endTime?: string;
}

interface EmployeeCalendarEvent {
  id: string;
  itemType: 'reservation' | 'training';
  title: string;
  start: Date;
  end: Date;
  status: ReservationStatus | AppointmentStatus;
  athleteName: string;
  trainerName: string | null;
  sportName: string;
  editable: boolean;
}

interface EmployeeCalendarResponse {
  facility: {
    id: string;
    name: string;
  };
  resource: {
    id: string;
    name: string;
    type: ResourceType;
    sportName: string;
  };
  openingHours: Array<{
    day: number;
    open: string;
    close: string;
  }>;
  events: EmployeeCalendarEvent[];
}

export type {
  EmployeeCalendarEvent,
  EmployeeCalendarQuery,
  EmployeeCalendarResponse,
  MoveReservationBody,
};
