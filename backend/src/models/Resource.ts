import { Schema, model, type Types } from 'mongoose';

enum ResourceType {
  Outdoor = 'outdoor',
  Indoor = 'indoor',
  TeamHall = 'team_hall',
}

interface IResource {
  _id?: Types.ObjectId;
  facilityId: Types.ObjectId;
  name: string;
  type: ResourceType;
  sportId: Types.ObjectId;
  capacity: number;
  equipmentDescription: string;
  active: boolean;
}

const resourceSchema = new Schema<IResource>(
  {
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ResourceType),
    },
    sportId: {
      type: Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'capacity must be an integer',
      },
    },
    equipmentDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    collection: 'resources',
  },
);

const Resource = model<IResource>('Resource', resourceSchema);

export { Resource, ResourceType, type IResource };
