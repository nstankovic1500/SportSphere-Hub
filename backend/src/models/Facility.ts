import { Schema, model, type Types } from 'mongoose';

enum FacilityStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

interface IOpeningHour {
  day: number;
  open: string;
  close: string;
}

interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface IFacility {
  _id?: Types.ObjectId;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  location: IGeoPoint;
  sports: Types.ObjectId[];
  images?: string[];
  openingHours?: IOpeningHour[];
  hourlyPrice: number;
  allowedNoShows: number;
  employeeIds?: Types.ObjectId[];
  status: FacilityStatus;
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

const geoPointSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      required: true,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]): boolean => value.length === 2,
        message: 'coordinates must contain [longitude, latitude]',
      },
    },
  },
  {
    _id: false,
  },
);

const facilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: geoPointSchema, required: true },
    sports: [{ type: Schema.Types.ObjectId, ref: 'Sport', required: true }],
    images: [{ type: String }],
    openingHours: [openingHourSchema],
    hourlyPrice: { type: Number, required: true, min: 0 },
    allowedNoShows: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'allowedNoShows must be an integer',
      },
    },
    employeeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      required: true,
      enum: Object.values(FacilityStatus),
    },
    active: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'facilities',
  },
);

const Facility = model<IFacility>('Facility', facilitySchema);

export {
  Facility,
  FacilityStatus,
  type IFacility,
  type IGeoPoint,
  type IOpeningHour,
};
