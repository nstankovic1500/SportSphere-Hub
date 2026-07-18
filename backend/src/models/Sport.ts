import { Schema, model, type Types } from 'mongoose';

interface ISport {
  _id?: Types.ObjectId;
  name: string;
  active: boolean;
}

const sportSchema = new Schema<ISport>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    collection: 'sports',
  },
);

const Sport = model<ISport>('Sport', sportSchema);

export { Sport, type ISport };
