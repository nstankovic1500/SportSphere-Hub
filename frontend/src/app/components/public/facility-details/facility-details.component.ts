import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type {
  FacilityComment,
  FacilityDetails,
} from '../../../core/models/public.model';
import type { User } from '../../../core/models/user.model';
import { AthleteService } from '../../../core/services/athlete.service';
import { AuthService } from '../../../core/services/auth.service';
import { PublicService } from '../../../core/services/public.service';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-facility-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './facility-details.component.html',
  styleUrl: './facility-details.component.css',
})
export class FacilityDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicService = inject(PublicService);
  private readonly athleteService = inject(AthleteService);
  private readonly authService = inject(AuthService);

  readonly reviewForm = this.formBuilder.nonNullable.group({
    reaction: ['', Validators.required],
    comment: ['', [Validators.required, Validators.maxLength(500)]],
  });

  isLoading = true;
  isSubmittingReview = false;
  errorMessage = '';
  reviewErrorMessage = '';
  reviewSuccessMessage = '';
  facility: FacilityDetails | null = null;
  comments: FacilityComment[] = [];
  likesCount = 0;
  dislikesCount = 0;
  currentUser: User | null = null;

  constructor() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser && this.authService.getToken()) {
      this.authService.loadCurrentUser().subscribe((user) => {
        this.currentUser = user;
      });
    }

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadPageData(id);
  }

  get reaction() {
    return this.reviewForm.controls.reaction;
  }

  get comment() {
    return this.reviewForm.controls.comment;
  }

  get canReserve() {
    return this.currentUser?.role === 'athlete';
  }

  get canReview() {
    return this.currentUser?.role === 'athlete';
  }

  getDayName(day: number) {
    return dayNames[day] ?? `Day ${day}`;
  }

  submitReview() {
    if (!this.facility) {
      return;
    }

    if (this.reviewForm.invalid || this.isSubmittingReview) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmittingReview = true;
    this.reviewErrorMessage = '';
    this.reviewSuccessMessage = '';

    this.athleteService.createFacilityReview(this.facility.id, {
      reaction: this.reaction.value as 'like' | 'dislike',
      comment: this.comment.value.trim(),
    }).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.reviewSuccessMessage = 'Review submitted successfully.';
        this.reviewForm.reset({
          reaction: '',
          comment: '',
        });
        this.loadReviews(this.facility!.id);
      },
      error: (error) => {
        this.isSubmittingReview = false;
        this.reviewErrorMessage = error.error?.message ?? 'Unable to submit review.';
      },
    });
  }

  private loadPageData(id: string) {
    forkJoin({
      facilityResponse: this.publicService.getFacilityDetails(id),
      reviewsResponse: this.publicService.getFacilityReviews(id),
    }).subscribe({
      next: ({ facilityResponse, reviewsResponse }) => {
        this.facility = facilityResponse.data.facility;
        this.likesCount = reviewsResponse.data.likesCount;
        this.dislikesCount = reviewsResponse.data.dislikesCount;
        this.comments = reviewsResponse.data.comments;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load facility details.';
        this.isLoading = false;
      },
    });
  }

  private loadReviews(facilityId: string) {
    this.publicService.getFacilityReviews(facilityId).subscribe({
      next: (response) => {
        this.likesCount = response.data.likesCount;
        this.dislikesCount = response.data.dislikesCount;
        this.comments = response.data.comments;
      },
      error: (error) => {
        this.reviewErrorMessage = error.error?.message ?? 'Unable to load reviews.';
      },
    });
  }
}
