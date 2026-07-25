import type { AppointmentStatus } from '../../models/Appointment';
import type { ReservationStatus } from '../../models/Reservation';

type AttendanceType = 'all' | 'reservations' | 'trainings';

interface AttendanceQuery {
  date?: string;
  type?: AttendanceType;
}

interface AttendanceItem {
  id: string;
  type: 'reservation' | 'training';
  athleteId: string;
  athleteName: string;
  resourceName: string | null;
  trainerName: string | null;
  sportName: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus | AppointmentStatus;
  attencanceRecordEnabled: boolean;
}

interface AttendanceUpdateResult {
  item: AttendanceItem;
  totalNoShows?: number;
  allowedNoShows?: number;
  athleteBlockedInFacility?: boolean;
}

export type {
  AttendanceItem,
  AttendanceQuery,
  AttendanceType,
  AttendanceUpdateResult,
};
