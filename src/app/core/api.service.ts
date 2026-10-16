import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  catchError,
  shareReplay,
  tap,
  throwError,
  timeout
} from 'rxjs';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

export interface ServiceItem {
  ServiceID: number;
  ServiceName: string;
  Description: string;
  Price: number | string;
  Duration: number;
  Category?: string;
  ServiceImage?: string;
  AvailabilityStatus?: string;
}

export interface SiteSettings {
  SiteName: string;
  LogoPath: string;
  OwnerName: string;
  OwnerTitle: string;
  OwnerBio: string;
  OwnerPhoto: string;
  ContactEmail: string;
  ContactPhone: string;
  Address: string;
  BusinessHours: string;
}

export interface Booking {
  BookingID: number;
  ServiceName: string;
  BookingDate: string;
  BookingTime: string;
  BookingStatus: string;
  BookingAmount?: number | string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private settingsCache$?: Observable<SiteSettings>;

  readonly baseUrl = (
    Capacitor.isNativePlatform()
      ? environment.nativeApiBaseUrl
      : environment.apiBaseUrl
  ).replace(/\/$/, '');

  services(): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>(
      `${this.baseUrl}/services.php?v=${Date.now()}`,
      { withCredentials: true }
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  settings(forceRefresh = false): Observable<SiteSettings> {
    if (forceRefresh || !this.settingsCache$) {
      this.settingsCache$ = this.http.get<SiteSettings>(
        `${this.baseUrl}/settings.php`,
        { withCredentials: true }
      ).pipe(
        timeout(6000),
        catchError(this.handleError),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.settingsCache$;
  }

  login(username: string, password: string, type: 'customer' | 'admin') {
    return this.http.post<any>(
      `${this.baseUrl}/auth.php`,
      { action: 'login', username, password, type },
      this.requestOptions()
    ).pipe(
      tap(response => {
        if (response?.sessionToken) {
          localStorage.setItem(
            'selectcutz_session',
            response.sessionToken
          );
        }
      }),
      timeout(6000),
      catchError(this.handleError)
    );
  }

  register(
    fullName: string,
    email: string,
    phone: string,
    password: string
  ) {
    return this.http.post<any>(
      `${this.baseUrl}/auth.php`,
      { action: 'register', fullName, email, phone, password },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  createBooking(
    customerId: number,
    serviceId: number,
    date: string,
    time: string
  ) {
    return this.http.post<any>(
      `${this.baseUrl}/booking_create.php`,
      { customerId, serviceId, date, time },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  customerData(customerId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/customer.php?customerId=${encodeURIComponent(customerId)}`,
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  cancelBooking(customerId: number, bookingId: number) {
    return this.http.post<any>(
      `${this.baseUrl}/booking_cancel.php`,
      { customerId, bookingId },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  adminReports() {
    return this.http.post<any>(
      `${this.baseUrl}/admin.php`,
      { action: 'reports' },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  adminBookings() {
    return this.http.post<any>(
      `${this.baseUrl}/admin.php`,
      { action: 'allBookings' },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  completeBooking(bookingId: number) {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(
      `${this.baseUrl}/admin.php`,
      { action: 'completeBooking', bookingId },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  addService(data: {
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    image: string;
    imageData?: string;
    imageName?: string;
  }) {
    return this.http.post<any>(
      `${this.baseUrl}/admin.php`,
      { action: 'addService', ...data },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  deleteService(serviceId: number) {
    return this.http.post<any>(
      `${this.baseUrl}/admin.php`,
      { action: 'deleteService', serviceId },
      this.requestOptions()
    ).pipe(
      timeout(6000),
      catchError(this.handleError)
    );
  }

  updateSite(data: Partial<SiteSettings>) {
    return this.http.post<any>(
      `${this.baseUrl}/site_update.php`,
      data,
      this.requestOptions()
    ).pipe(
      tap(() => this.settingsCache$ = undefined),
      timeout(6000),
      catchError(this.handleError)
    );
  }

  logout() {
    return this.http.post<any>(
      `${this.baseUrl}/logout.php`,
      {},
      this.requestOptions()
    ).pipe(
      tap(() => localStorage.removeItem('selectcutz_session')),
      timeout(10000),
      catchError(this.handleError)
    );
  }

  private requestOptions(): {
    withCredentials: boolean;
    headers: Record<string, string>;
  } {
    const token = localStorage.getItem('selectcutz_session');
    const headers: Record<string, string> = {};

    if (token) {
      headers['X-Session-Token'] = token;
    }

    return {
      withCredentials: true,
      headers
    };
  }

  private handleError(error: HttpErrorResponse | Error) {
    const httpError = error as HttpErrorResponse;

    if (error.name === 'TimeoutError') {
      return throwError(() => new Error(
        'The SELECT CUTZ server took too long to respond. Please check the connection and try again.'
      ));
    }

    if (httpError.status === 0) {
      const message = environment.production
        ? 'The SELECT CUTZ server is currently unavailable. Please try again shortly.'
        : 'Cannot reach the SELECT CUTZ API. Start Apache and MySQL in XAMPP, then restart ionic serve.';

      return throwError(() => new Error(message));
    }

    const message = httpError.error?.message ||
      error.message ||
      'Unable to connect to the SELECT CUTZ server.';

    return throwError(() => new Error(message));
  }
}
