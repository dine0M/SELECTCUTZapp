import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { DashboardPage } from './dashboard.page';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  const customer = {
    id: 1,
    name: 'Test Customer',
    type: 'customer' as const,
    username: 'customer@example.test'
  };

  const booking = {
    BookingID: 10,
    ServiceName: 'Classic Fade',
    BookingDate: '2030-06-10',
    BookingTime: '10:00:00',
    BookingStatus: 'Confirmed',
    BookingAmount: '150.00'
  };

  let auth: {
    user: {
      id: number;
      name: string;
      type: 'customer' | 'admin';
      username: string;
    } | null;
    logout: ReturnType<typeof vi.fn>;
  };

  let api: {
    settings: ReturnType<typeof vi.fn>;
    customerData: ReturnType<typeof vi.fn>;
    adminReports: ReturnType<typeof vi.fn>;
    adminBookings: ReturnType<typeof vi.fn>;
    cancelBooking: ReturnType<typeof vi.fn>;
    completeBooking: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      user: { ...customer },
      logout: vi.fn()
    };

    api = {
      settings: vi.fn().mockReturnValue(of({
        SiteName: 'SELECT CUTZ',
        LogoPath: 'assets/logo.jpg'
      })),
      customerData: vi.fn().mockReturnValue(of({
        bookings: [booking],
        notifications: [{
          Message: 'Booking confirmed.',
          NotificationDate: '2030-06-01'
        }]
      })),
      adminReports: vi.fn().mockReturnValue(of({
        summary: {
          TotalCustomers: 5,
          TotalBookings: 10,
          TotalServices: 6,
          TotalRevenue: 150
        }
      })),
      adminBookings: vi.fn().mockReturnValue(of([booking])),
      cancelBooking: vi.fn().mockReturnValue(of({
        success: true,
        message: 'Booking cancelled.'
      })),
      completeBooking: vi.fn().mockReturnValue(of({
        success: true,
        message: 'Booking completed.'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('loads the logged-in customer bookings and notifications', () => {
    fixture.detectChanges();

    expect(api.customerData).toHaveBeenCalledWith(customer.id);
    expect(component.bookings).toEqual([booking]);
    expect(component.notifications).toHaveLength(1);
    expect(component.loading).toBe(false);
    expect(api.adminReports).not.toHaveBeenCalled();
  });

  it('redirects a signed-out visitor to login', () => {
    auth.user = null;

    fixture.detectChanges();

    expect(TestBed.inject(Router).navigateByUrl)
      .toHaveBeenCalledWith('/login');
    expect(api.customerData).not.toHaveBeenCalled();
    expect(api.adminBookings).not.toHaveBeenCalled();
  });

  it('loads reports and bookings for an administrator', () => {
    auth.user = {
      id: 2,
      name: 'Test Admin',
      type: 'admin',
      username: 'admin@example.test'
    };

    fixture.detectChanges();

    expect(api.adminReports).toHaveBeenCalled();
    expect(api.adminBookings).toHaveBeenCalled();
    expect(component.summary.TotalBookings).toBe(10);
    expect(component.bookings).toEqual([booking]);
    expect(api.customerData).not.toHaveBeenCalled();
  });

  it('shows an error and stops loading when customer data fails', () => {
    api.customerData.mockReturnValue(
      throwError(() => new Error('Unable to load bookings.'))
    );

    fixture.detectChanges();

    expect(component.error).toBe('Unable to load bookings.');
    expect(component.loading).toBe(false);
  });

  it('does not cancel a booking when the customer declines', () => {
    fixture.detectChanges();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.cancel(booking.BookingID);

    expect(api.cancelBooking).not.toHaveBeenCalled();
  });

  it('cancels a confirmed booking and reloads customer data', () => {
    fixture.detectChanges();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.cancel(booking.BookingID);

    expect(api.cancelBooking)
      .toHaveBeenCalledWith(customer.id, booking.BookingID);
    expect(component.message).toBe('Booking cancelled.');
    expect(api.customerData).toHaveBeenCalledTimes(2);
  });
});
