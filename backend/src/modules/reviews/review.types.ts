import type { AuthenticatedRequest } from '../auth/auth.types';

interface CreateReviewBody {
  reaction: 'like' | 'dislike';
  comment: string;
}

interface ReviewComment {
  id: string;
  athleteName: string;
  reaction: 'like' | 'dislike';
  comment: string;
  createdAt: Date;
}

interface FacilityReviewsResponse {
  likesCount: number;
  dislikesCount: number;
  comments: ReviewComment[];
}

interface AuthenticatedAthleteReviewRequest extends AuthenticatedRequest {
  auth: NonNullable<AuthenticatedRequest['auth']>;
}

export type {
  AuthenticatedAthleteReviewRequest,
  CreateReviewBody,
  FacilityReviewsResponse,
  ReviewComment,
};
