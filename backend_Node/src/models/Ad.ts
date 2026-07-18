import { Schema, model, type Types } from 'mongoose';

enum AdStatus {
  Active = 'active',
  Completed = 'completed',
  Closed = 'closed',
}

interface IAd {
  _id?: Types.ObjectId;
  authorId: Types.ObjectId;
  sportId: Types.ObjectId;
  city: string;
  date: Date;
  startTime: string;
  endTime: string;
  missingPlayers: number;
  acceptedPlayers: number;
  status: AdStatus;
  createdAt?: Date;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const AdSchema = new Schema<IAd>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    city: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: {
      type: String,
      required: true,
      match: [timePattern, 'startTime must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: true,
      match: [timePattern, 'endTime must be in HH:mm format'],
    },
    missingPlayers: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'missingPlayers must be an integer',
      },
    },
    acceptedPlayers: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'acceptedPlayers must be an integer',
      },
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(AdStatus),
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'Ads',
  },
);

const Ad = model<IAd>('Ad', AdSchema);

export { Ad, AdStatus, type IAd };
