import { Types } from 'mongoose';

import { Facility } from '../../models/Facility';
import { Reservation, ReservationStatus } from '../../models/Reservation';
import { Review, ReviewReaction, type IReview } from '../../models/Review';
import { AppError } from '../../utils/AppError';
import type {
  CreateReviewBody,
  FacilityReviewsResponse,
  ReviewComment,
} from './review.types';

type PopulatedReview = IReview & {
  _id: Types.ObjectId;
  athleteId: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
  };
};

const IS_QUALIFIED = [
  ReservationStatus.Confirmed,
  ReservationStatus.Attended,
];

const validateFacilityId = (facilityId: string) => {
  if (!Types.ObjectId.isValid(facilityId)) {
    throw new AppError('Invalid facility id', 400);
  }
};

const ensureFacilityExists = async (facilityId: string) => {
  const facility = await Facility.findById(facilityId).select('_id');

  if (!facility) {
    throw new AppError('Facility not found', 404);
  }
};

const toReviewComment = (review: PopulatedReview): ReviewComment => {
  return {
    id: review._id.toString(),
    athleteName: `${review.athleteId.firstName} ${review.athleteId.lastName}`.trim(),
    reaction: review.reaction,
    comment: review.comment,
    createdAt: review.createdAt ?? new Date(),
  };
};

const getFacilityReviews = async (
  facilityId: string,
): Promise<FacilityReviewsResponse> => {
  validateFacilityId(facilityId);
  await ensureFacilityExists(facilityId);

  const likesCount = await Review.countDocuments({
    facilityId: new Types.ObjectId(facilityId),
    reaction: ReviewReaction.Like,
  });

  const dislikesCount = await Review.countDocuments({
    facilityId: new Types.ObjectId(facilityId),
    reaction: ReviewReaction.Dislike,
  });

  const comments = (await Review.find({
    facilityId: new Types.ObjectId(facilityId),
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'athleteId',
      select: 'firstName lastName',
    })
    .lean()) as unknown as PopulatedReview[];

  return {
    likesCount,
    dislikesCount,
    comments: comments.map((comment) => toReviewComment(comment)),
  };
};

const createReview = async (
  athleteId: string,
  facilityId: string,
  body: CreateReviewBody,
): Promise<ReviewComment> => {
  validateFacilityId(facilityId);
  await ensureFacilityExists(facilityId);

  const reaction = String(body.reaction ?? '').trim();
  const comment = String(body.comment ?? '').trim();

  if (!reaction) {
    throw new AppError('reaction is required', 400);
  }

  if (reaction !== ReviewReaction.Like && reaction !== ReviewReaction.Dislike) {
    throw new AppError('reaction must be like or dislike', 400);
  }

  if (!comment) {
    throw new AppError('comment is required', 400);
  }

  if (comment.length > 500) {
    throw new AppError('comment can contain at most 500 characters', 400);
  }

  const qualifyingReservationsCount = await Reservation.countDocuments({
    athleteId: new Types.ObjectId(athleteId),
    facilityId: new Types.ObjectId(facilityId),
    status: { $in: IS_QUALIFIED },
  });

  if (qualifyingReservationsCount === 0) {
    throw new AppError('You can review a facility only after a qualifying reservation', 403);
  }

  const existingReviewsCount = await Review.countDocuments({
    athleteId: new Types.ObjectId(athleteId),
    facilityId: new Types.ObjectId(facilityId),
  });

  if (existingReviewsCount >= qualifyingReservationsCount) {
    throw new AppError('You have reached the review limit for this facility', 400);
  }

  const createdReview = await Review.create({
    athleteId: new Types.ObjectId(athleteId),
    facilityId: new Types.ObjectId(facilityId),
    reaction,
    comment,
    createdAt: new Date(),
  });

  const populatedReview = (await Review.findById(createdReview._id)
    .populate({
      path: 'athleteId',
      select: 'firstName lastName',
    })
    .lean()) as unknown as PopulatedReview | null;

  if (!populatedReview) {
    throw new AppError('Review not found', 404);
  }

  return toReviewComment(populatedReview);
};

export {
  createReview,
  getFacilityReviews,
};
