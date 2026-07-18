import { Schema, model, type Types } from 'mongoose';

enum RequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

interface IRequest {
  _id?: Types.ObjectId;
  adId: Types.ObjectId;
  athleteId: Types.ObjectId;
  status: RequestStatus;
  createdAt?: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    adId: { type: Schema.Types.ObjectId, ref: 'TeammateAd', required: true },
    athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(RequestStatus),
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'requests',
  },
);

const Request = model<IRequest>('Request', RequestSchema);

export { Request, RequestStatus, type IRequest };
