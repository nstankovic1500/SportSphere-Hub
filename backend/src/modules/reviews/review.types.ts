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

export type {
  CreateReviewBody,
  FacilityReviewsResponse,
  ReviewComment,
};
