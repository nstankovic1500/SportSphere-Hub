import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { FacilityListItem } from '../../../core/models/public.model';
import type { Sport } from '../../../core/models/sport.model';
import { PublicService } from '../../../core/services/public.service';

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

  readonly filterForm = this.formBuilder.nonNullable.group({
    name: [''],
    cities: this.formBuilder.nonNullable.control<string[]>([]),
    sportId: [''],
    resourceType: [''],
    sortBy: this.formBuilder.nonNullable.control<'name' | 'city'>('name'),
    sortOrder: this.formBuilder.nonNullable.control<'asc' | 'desc'>('asc'),
  });

  cities: string[] = [];
  sports: Sport[] = [];
  facilities: FacilityListItem[] = [];
  isLoading = true;
  isSearching = false;
  errorMessage = '';

  constructor() {
    this.loadPageData();
  }

  onCityChange(city: string, checked: boolean) {
    const currentCities = this.filterForm.controls.cities.value;

    this.filterForm.controls.cities.setValue(
      checked
        ? [...currentCities, city]
        : currentCities.filter((currentCity) => currentCity !== city),
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
      sortBy: 'name',
      sortOrder: 'asc',
    });

    this.fetchFacilities(true);
  }

  getSportsLabel(facility: FacilityListItem) {
    return facility.sports.map((sport) => sport.name).join(', ');
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
        this.errorMessage = error.error?.message ?? 'Unable to load filters.';
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

    this.publicService
      .getFacilities({
        name: formValue.name.trim() || undefined,
        cities: formValue.cities.length ? formValue.cities.join(',') : undefined,
        sportId: formValue.sportId || undefined,
        resourceType:
          (formValue.resourceType as 'outdoor' | 'indoor' | 'team_hall' | '') || undefined,
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
          this.errorMessage = error.error?.message ?? 'Unable to load facilities.';
          this.isLoading = false;
          this.isSearching = false;
        },
      });
  }
}
