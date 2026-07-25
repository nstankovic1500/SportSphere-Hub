import { Schema, model, type Types } from 'mongoose';

import type { IOpeningHour } from './Facility';

interface ITrainer {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  facilityId: Types.ObjectId;
  sports: Types.ObjectId[];
  workingHours: IOpeningHour[];
  biography: string;
  pricePerHour: number;
  active: boolean;
  createdAt?: Date;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const openingHourSchema = new Schema<IOpeningHour>(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      validate: {
        validator: Number.isInteger,
        message: 'day must be an integer from 0 to 6',
      },
    },
    open: {
      type: String,
      required: true,
      match: [timePattern, 'open must be in HH:mm format'],
    },
    close: {
      type: String,
      required: true,
      match: [timePattern, 'close must be in HH:mm format'],
    },
  },
  {
    _id: false,
  },
);

const trainerSchema = new Schema<ITrainer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
    },
    sports: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Sport' }],
      required: true,
    },
    workingHours: {
      type: [openingHourSchema],
      required: true,
    },
    biography: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    pricePerHour: { type: Number, required: true, min: 0 },
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'trainers',
  },
);

const Trainer = model<ITrainer>('Trainer', trainerSchema);

export { Trainer, type ITrainer };
