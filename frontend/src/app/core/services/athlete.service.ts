import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  AthleteCartApiResponse,
  AthleteOrderApiResponse,
  AthleteOrdersApiResponse,
} from '../models/api-response.model';
import type {
  AthleteCartItemRequest,
  AthleteCartQuantityRequest,
  AthleteReservationRequest,
  AthleteProfile,
  AthleteReservation,
  CreateFacilityReviewRequest,
  ResourceAvailability,
  UpdateAthleteProfileRequest,
} from '../models/athlete.model';
import type { FacilityComment } from '../models/public.model';

@Injectable({
  providedIn: 'root',
})
export class AthleteService {
  private readonly http = inject(HttpClient);

  getProfile() {
    return this.http.get<ApiResponse<{ athlete: AthleteProfile }>>(
      `${environment.apiUrl}/athletes/profile`,
    );
  }

  updateProfile(payload: UpdateAthleteProfileRequest) {
    return this.http.patch<ApiResponse<{ athlete: AthleteProfile }>>(
      `${environment.apiUrl}/athletes/profile`,
      payload,
    );
  }

  uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('profileImage', file);

    return this.http.patch<ApiResponse<{ imagePath: string }>>(
      `${environment.apiUrl}/users/profile-image`,
      formData,
    );
  }

  getReservations() {
    return this.http.get<ApiResponse<{ reservations: AthleteReservation[] }>>(
      `${environment.apiUrl}/athletes/reservations`,
    );
  }

  cancelReservation(id: string) {
    return this.http.patch<ApiResponse<{ reservation: AthleteReservation }>>(
      `${environment.apiUrl}/athletes/reservations/${id}/cancel`,
      {},
    );
  }

  getResourceAvailability(resourceId: string, date: string) {
    return this.http.get<ApiResponse<{ availability: ResourceAvailability }>>(
      `${environment.apiUrl}/athletes/resources/${resourceId}/availability`,
      {
        params: {
          date,
        },
      },
    );
  }

  createReservation(payload: AthleteReservationRequest) {
    return this.http.post<ApiResponse<{ reservation: AthleteReservation }>>(
      `${environment.apiUrl}/athletes/reservations`,
      payload,
    );
  }

  createFacilityReview(facilityId: string, payload: CreateFacilityReviewRequest) {
    return this.http.post<ApiResponse<{ review: FacilityComment }>>(
      `${environment.apiUrl}/facilities/${facilityId}/reviews`,
      payload,
    );
  }

  getCart() {
    return this.http.get<AthleteCartApiResponse>(
      `${environment.apiUrl}/athletes/cart`,
    );
  }

  addCartItem(payload: AthleteCartItemRequest) {
    return this.http.post<AthleteCartApiResponse>(
      `${environment.apiUrl}/cart/items`,
      payload,
    );
  }

  updateCartItem(itemId: string, payload: AthleteCartQuantityRequest) {
    return this.http.patch<AthleteCartApiResponse>(
      `${environment.apiUrl}/cart/items/${itemId}`,
      payload,
    );
  }

  deleteCartItem(itemId: string) {
    return this.http.delete<AthleteCartApiResponse>(
      `${environment.apiUrl}/cart/items/${itemId}`,
    );
  }

  checkoutOrders() {
    return this.http.post<AthleteOrdersApiResponse>(
      `${environment.apiUrl}/orders`,
      {},
    );
  }

  getOrders() {
    return this.http.get<AthleteOrdersApiResponse>(
      `${environment.apiUrl}/athletes/orders`,
    );
  }

  updateOrderStatus(orderId: string, status: 'cancelled') {
    return this.http.patch<AthleteOrderApiResponse>(
      `${environment.apiUrl}/athletes/orders/${orderId}/status`,
      { status },
    );
  }
}
