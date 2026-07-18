import { Schema, model, type Types } from 'mongoose';

enum AppointmentStatus {
  Scheduled = 'scheduled',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

interface IAppointment {
  _id?: Types.ObjectId;
  trainerId: Types.ObjectId;
  athleteId: Types.ObjectId;
  facilityId: Types.ObjectId;
  sportId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  createdAt?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    trainerId: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
    athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(AppointmentStatus),
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'appointments',
  },
);

appointmentSchema.path('endTime').validate(function validateEndTime(value: Date): boolean {
  return value.getTime() > this.startTime.getTime();
}, 'endTime must be after startTime');

const Appointment = model<IAppointment>('Appointment', appointmentSchema);

export { Appointment, AppointmentStatus, type IAppointment };
