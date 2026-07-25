import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  PublicCitiesApiResponse,
  PublicFacilitiesApiResponse,
  PublicFacilityDetailsApiResponse,
  PublicFacilityReviewsApiResponse,
  PublicHomeApiResponse,
  PublicProductApiResponse,
  PublicProductsApiResponse,
  ApiResponse,
  SportsResponseData,
} from '../models/api-response.model';
import type { FacilitiesQueryParams } from '../models/public.model';

@Injectable({
  providedIn: 'root',
})
export class PublicService {
  private readonly http = inject(HttpClient);

  getHome() {
    return this.http.get<PublicHomeApiResponse>(
      `${environment.apiUrl}/public/home`,
    );
  }

  getCities() {
    return this.http.get<PublicCitiesApiResponse>(
      `${environment.apiUrl}/public/cities`,
    );
  }

  getSports() {
    return this.http.get<ApiResponse<SportsResponseData>>(
      `${environment.apiUrl}/sports`,
    );
  }

  getFacilities(query: FacilitiesQueryParams) {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<PublicFacilitiesApiResponse>(
      `${environment.apiUrl}/public/facilities`,
      { params },
    );
  }

  getFacilityDetails(id: string) {
    return this.http.get<PublicFacilityDetailsApiResponse>(
      `${environment.apiUrl}/public/facilities/${id}`,
    );
  }

  getFacilityReviews(facilityId: string) {
    return this.http.get<PublicFacilityReviewsApiResponse>(
      `${environment.apiUrl}/facilities/${facilityId}/reviews`,
    );
  }

  getProducts() {
    return this.http.get<PublicProductsApiResponse>(
      `${environment.apiUrl}/products`,
    );
  }

  getProduct(productId: string) {
    return this.http.get<PublicProductApiResponse>(
      `${environment.apiUrl}/products/${productId}`,
    );
  }
}
