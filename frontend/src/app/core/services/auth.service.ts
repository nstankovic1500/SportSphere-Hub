import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  CurrentUserResponseData,
  LoginResponseData,
} from '../models/api-response.model';
import type { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenStorageKey = 'access_token';

  private readonly currentUserSubject =
    new BehaviorSubject<User | null>(null);

  readonly currentUser$ =
    this.currentUserSubject.asObservable();

  login(username: string, password: string) {
    return this._login(username, password, false)
  }

  adminLogin(username: string, password: string) {
    return this._login(username, password, true)
  }

  _login(username: string, password: string, isAdmin: boolean) {
    let url = isAdmin? 'adminLogin' : 'login'
    return this.http
      .post<ApiResponse<LoginResponseData>>(
        `${environment.apiUrl}/auth/${url}`,
        { username, password },
      )
      .pipe(
        tap((response) => {
          this.saveSession(
            response.data.token,
            response.data.user,
          );
        }),
      );
    }

  loadCurrentUser() {
    return this.http
      .get<ApiResponse<CurrentUserResponseData>>(
        `${environment.apiUrl}/auth/current`,
      )
      .pipe(
        map((response) => response.data.user),

        tap((user) => {
          this.currentUserSubject.next(user);
        }),

        catchError(() => {
          this.clearSession();
          return of(null);
        }),
      );
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private saveSession(token: string, user: User): void {
    localStorage.setItem(this.tokenStorageKey, token);
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
    this.currentUserSubject.next(null);
  }
}