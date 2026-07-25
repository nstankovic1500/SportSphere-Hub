import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  AdCreateApiResponse,
  AdListApiResponse,
  AdRequestsApiResponse,
  ApplyToAdApiResponse,
} from '../models/api-response.model';
import type { AdFilters, CreateAdRequest } from '../models/ad.model';

@Injectable({
  providedIn: 'root',
})
export class AdService {
  private readonly http = inject(HttpClient);

  getAds(filters: AdFilters) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<AdListApiResponse>(`${environment.apiUrl}/ads`, { params });
  }

  createAd(payload: CreateAdRequest) {
    return this.http.post<AdCreateApiResponse>(`${environment.apiUrl}/ads`, payload);
  }

  applyToAd(adId: string) {
    return this.http.post<ApplyToAdApiResponse>(`${environment.apiUrl}/ads/${adId}/apply`, {});
  }

  closeAd(adId: string) {
    return this.http.patch<AdCreateApiResponse>(`${environment.apiUrl}/ads/${adId}/close`, {});
  }

  getAdRequests(adId: string) {
    return this.http.get<AdRequestsApiResponse>(`${environment.apiUrl}/ads/${adId}/requests`);
  }

  approveRequest(requestId: string) {
    return this.http.patch<ApplyToAdApiResponse>(
      `${environment.apiUrl}/apply-requests/${requestId}/accept`,
      {},
    );
  }

  rejectRequest(requestId: string) {
    return this.http.patch<ApplyToAdApiResponse>(
      `${environment.apiUrl}/apply-requests/${requestId}/reject`,
      {},
    );
  }
}
