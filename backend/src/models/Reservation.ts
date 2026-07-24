import { Schema, model, type Types } from 'mongoose';

enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Attended = 'attended',
  NoShow = 'no_show',
}

interface IReservation {
  _id?: Types.ObjectId;
  athleteId: Types.ObjectId;
  facilityId: Types.ObjectId;
  resourceId: Types.ObjectId;
  sportId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  createdAt?: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(ReservationStatus),
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'reservations',
  },
);

reservationSchema.index({ resourceId: 1, startTime: 1, endTime: 1, status: 1 });
reservationSchema.index({ athleteId: 1, startTime: -1 });

reservationSchema.path('endTime').validate(function validateEndTime(value: Date): boolean {
  return value.getTime() > this.startTime.getTime();
}, 'endTime must be after startTime');

const Reservation = model<IReservation>('Reservation', reservationSchema);

export { Reservation, ReservationStatus, type IReservation };
