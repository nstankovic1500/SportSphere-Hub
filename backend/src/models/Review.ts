import { Schema, model, type Types } from 'mongoose';

enum ReviewReaction {
  Like = 'like',
  Dislike = 'dislike',
}

interface IReview {
  _id?: Types.ObjectId;
  athleteId: Types.ObjectId;
  facilityId: Types.ObjectId;
  reaction: ReviewReaction;
  comment: string;
  createdAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    reaction: {
      type: String,
      required: true,
      enum: Object.values(ReviewReaction),
    },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'reviews',
  },
);

const Review = model<IReview>('Review', reviewSchema);

export { Review, ReviewReaction, type IReview };
