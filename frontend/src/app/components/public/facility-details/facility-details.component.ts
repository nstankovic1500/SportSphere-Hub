import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

import type {
  FacilityComment,
  FacilityDetails,
} from '../../../core/models/public.model';
import type { User } from '../../../core/models/user.model';
import { AthleteService } from '../../../core/services/athlete.service';
import { AuthService } from '../../../core/services/auth.service';
import { PublicService } from '../../../core/services/public.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];

@Component({
  selector: 'app-facility-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './facility-details.component.html',
  styleUrl: './facility-details.component.css',
})
export class FacilityDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicService = inject(PublicService);
  private readonly athleteService = inject(AthleteService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

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

  get isBlockedInCurrentFacility() {
    return !!this.facility
      && !!this.currentUser
      && (this.currentUser.blockedFacilities ?? []).includes(this.facility.id);
  }

  getDayName(day: number) {
    return dayNames[day] ?? `Day ${day}`;
  }

  getImageUrl(imagePath: string | null) {
    return buildUploadImageUrl(imagePath);
  }

  getMapUrl(): SafeResourceUrl | null {
    if (!this.facility?.location?.coordinates || this.facility.location.coordinates.length < 2) {
      return null;
    }

    const [longitude, latitude] = this.facility.location.coordinates;
    const offset = 0.01;
    const mapUrl =
      `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - offset}%2C${latitude - offset}%2C${longitude + offset}%2C${latitude + offset}&layer=mapnik&marker=${latitude}%2C${longitude}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  reserveFacility() {
    if (!this.facility || !this.canReserve) {
      return;
    }

    if (this.isBlockedInCurrentFacility) {
      this.errorMessage =
        'Blokirani ste u ovom objektu i ne možete kreirati nove rezervacije ili treninge.';
      return;
    }

    void this.router.navigate(['/athlete/facilities', this.facility.id, 'reserve']);
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
        this.reviewSuccessMessage = 'Recenzija je uspešno poslata.';
        this.reviewForm.reset({
          reaction: '',
          comment: '',
        });
        this.loadReviews(this.facility!.id);
      },
      error: (error) => {
        this.isSubmittingReview = false;
        this.reviewErrorMessage = error.error?.message ?? 'Nije moguće poslati recenziju.';
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
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati detalje objekta.';
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
        this.reviewErrorMessage = error.error?.message ?? 'Nije moguće učitati recenzije.';
      },
    });
  }
}
