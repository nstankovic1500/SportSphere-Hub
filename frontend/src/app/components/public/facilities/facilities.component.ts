import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { FacilityListItem } from '../../../core/models/public.model';
import type { Sport } from '../../../core/models/sport.model';
import type { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { PublicService } from '../../../core/services/public.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-facilities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './facilities.component.html',
  styleUrl: './facilities.component.css',
})
export class FacilitiesComponent {
  private readonly publicService = inject(PublicService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    name: [''],
    cities: this.formBuilder.nonNullable.control<string[]>([]),
    sportId: [''],
    resourceType: [''],
    availableToday: false,
    sortBy: this.formBuilder.nonNullable.control<'name' | 'city'>('name'),
    sortOrder: this.formBuilder.nonNullable.control<'asc' | 'desc'>('asc'),
  });

  cities: string[] = [];
  sports: Sport[] = [];
  facilities: FacilityListItem[] = [];
  currentUser: User | null = this.authService.getCurrentUser();
  isLoading = true;
  isSearching = false;
  errorMessage = '';

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    if (this.authService.getToken() && !this.currentUser) {
      this.authService.loadCurrentUser().subscribe();
    }

    this.loadPageData();
  }

  onCityChange(city: string, checked: boolean) {
    const currentCities = this.filterForm.controls.cities.value;

    this.filterForm.controls.cities.setValue(
      checked
        ? [...currentCities, city]
        : currentCities.filter((currentCity) => !(currentCity === city)),
    );
  }

  isCitySelected(city: string) {
    return this.filterForm.controls.cities.value.includes(city);
  }

  applyFilters() {
    this.fetchFacilities(true);
  }

  resetFilters() {
    this.filterForm.reset({
      name: '',
      cities: [],
      sportId: '',
      resourceType: '',
      availableToday: false,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    this.fetchFacilities(true);
  }

  getSportsLabel(facility: FacilityListItem) {
    return facility.sports.map((sport) => sport.name).join(', ');
  }

  getImageUrl(imagePath: string | null) {
    return buildUploadImageUrl(imagePath);
  }

  get showAvailableTodayFilter() {
    return this.currentUser?.role === 'athlete';
  }

  get homeRoute() {
    const role = this.currentUser?.role;

    if (role === 'athlete') {
      return '/athlete';
    }

    if (role === 'employee') {
      return '/employee';
    }

    if (role === 'admin') {
      return '/admin';
    }

    return '/';
  }

  private loadPageData() {
    forkJoin({
      citiesResponse: this.publicService.getCities(),
      sportsResponse: this.publicService.getSports(),
    }).subscribe({
      next: ({ citiesResponse, sportsResponse }) => {
        this.cities = citiesResponse.data.cities;
        this.sports = sportsResponse.data.sports;
        this.fetchFacilities(false);
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati filtere.';
        this.isLoading = false;
      },
    });
  }

  private fetchFacilities(fromFilters: boolean) {
    this.errorMessage = '';

    if (fromFilters) {
      this.isSearching = true;
    } else {
      this.isLoading = true;
    }

    const formValue = this.filterForm.getRawValue();
    const availableToday =
      this.showAvailableTodayFilter && formValue.availableToday ? 'true' : undefined;

    this.publicService
      .getFacilities({
        name: formValue.name.trim() || undefined,
        cities: formValue.cities.length ? formValue.cities.join(',') : undefined,
        sportId: formValue.sportId || undefined,
        resourceType:
          (formValue.resourceType as 'outdoor' | 'indoor' | 'team_hall' | '') || undefined,
        availableToday,
        sortBy: formValue.sortBy,
        sortOrder: formValue.sortOrder,
      })
      .subscribe({
        next: (response) => {
          this.facilities = response.data.facilities;
          this.isLoading = false;
          this.isSearching = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Nije moguće učitati objekte.';
          this.isLoading = false;
          this.isSearching = false;
        },
      });
  }
}
