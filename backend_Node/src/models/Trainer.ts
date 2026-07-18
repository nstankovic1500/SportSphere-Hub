import { Schema, model, type Types } from 'mongoose';

interface ITrainer {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  facilityId: Types.ObjectId;
  sports: Types.ObjectId[];
  specialization: string;
  hourlyPrice: number;
  ratingAverage: number;
  ratingCount: number;
  active: boolean;
}

const trainerSchema = new Schema<ITrainer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
    },
    sports: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Sport' }],
      required: true,
    },
    specialization: { type: String, required: true, trim: true },
    hourlyPrice: { type: Number, required: true, min: 0 },
    ratingAverage: { type: Number, required: true, min: 0, max: 5, default: 0 },
    ratingCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'ratingCount must be an integer',
      },
    },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'trainers',
  },
);

const Trainer = model<ITrainer>('Trainer', trainerSchema);

export { Trainer, type ITrainer };
