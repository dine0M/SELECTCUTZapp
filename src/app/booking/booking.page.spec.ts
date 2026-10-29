import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingPage } from './booking.page';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LOCAL_SERVICES } from '../core/catalog';

describe('BookingPage', () => {
  let component: BookingPage;
  let fixture: ComponentFixture<BookingPage>;

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
    services: ReturnType<typeof vi.fn>;
    settings: ReturnType<typeof vi.fn>;
    createBooking: ReturnType<typeof vi.fn>;
  };

  const service = {
    ServiceID: 101,
    ServiceName: 'Test Fade',
    Description: 'Test haircut',
    Price: 150,
    Duration: 30
  };

  beforeEach(async () => {
    sessionStorage.removeItem('selectcutz_return_url');
    sessionStorage.removeItem('selectcutz_booking_confirmation');

    auth = {
      user: {
        id: 7,
        name: 'Test Customer',
        type: 'customer',
        username: 'customer@example.test'
      },
      logout: vi.fn()
    };

    api = {
      services: vi.fn().mockReturnValue(of([service])),
      settings: vi.fn().mockReturnValue(of({
        SiteName: 'SELECT CUTZ',
        LogoPath: 'assets/logo.jpg',
        ContactEmail: 'salon@example.test',
        ContactPhone: '0123456789',
        Address: 'Test address',
        BusinessHours: 'Mon - Sat: 08:00 - 18:00'
      })),
      createBooking: vi.fn().mockReturnValue(of({
        success: true,
        bookingId: 55,
        message: 'Booking confirmed.'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [BookingPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(BookingPage);
    component = fixture.componentInstance;

    // Keep date validation independent of the day tests run.
    component.minDate = '2030-06-01';
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('selectcutz_return_url');
    sessionStorage.removeItem('selectcutz_booking_confirmation');
    vi.restoreAllMocks();
  });

  function enterValidBooking(): void {
    component.serviceId = service.ServiceID;
    component.date = '2030-06-10';
    component.time = '10:00';
  }

  it('loads available services for a customer', () => {
    fixture.detectChanges();

    expect(api.services).toHaveBeenCalledTimes(1);
    expect(component.services).toEqual([service]);
  });

  it('redirects a signed-out visitor to login', () => {
    auth.user = null;

    fixture.detectChanges();

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/booking' } }
    );

    expect(sessionStorage.getItem('selectcutz_return_url'))
      .toBe('/booking');

    expect(api.services).not.toHaveBeenCalled();
  });

  it('prevents an administrator from submitting a customer booking', () => {
    auth.user = {
      id: 2,
      name: 'Test Admin',
      type: 'admin',
      username: 'admin@example.test'
    };

    enterValidBooking();
    component.submit();

    expect(api.createBooking).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/booking' } }
    );
  });

  it('uses local services when loading services fails', () => {
    api.services.mockReturnValue(
      throwError(() => new Error('Server unavailable.'))
    );

    fixture.detectChanges();

    expect(component.services).toEqual(LOCAL_SERVICES);
  });

  it('rejects missing service, date or time', () => {
    fixture.detectChanges();

    component.serviceId = 0;
    component.date = '';
    component.time = '';

    component.submit();

    expect(component.error)
      .toBe('Please select a service, date and time.');
    expect(api.createBooking).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('rejects a date before the minimum date', () => {
    fixture.detectChanges();
    enterValidBooking();
    component.date = '2030-05-31';

    component.submit();

    expect(component.error)
      .toBe('Please choose today or a future date.');
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it('creates a booking and opens its confirmation page', () => {
    fixture.detectChanges();
    enterValidBooking();

    component.submit();

    expect(api.createBooking).toHaveBeenCalledWith(
      7,
      101,
      '2030-06-10',
      '10:00'
    );

    const saved = JSON.parse(
      sessionStorage.getItem('selectcutz_booking_confirmation') || '{}'
    );

    expect(saved).toEqual({
      bookingId: 55,
      customerName: 'Test Customer',
      serviceName: 'Test Fade',
      price: 150,
      date: '2030-06-10',
      time: '10:00',
      status: 'Confirmed',
      message: 'Booking confirmed.'
    });

    expect(TestBed.inject(Router).navigateByUrl)
      .toHaveBeenCalledWith('/booking-confirmation');
    expect(component.busy).toBe(false);
  });

  it('shows a rejected booking without opening confirmation', () => {
    api.createBooking.mockReturnValue(of({
      success: false,
      message: 'This time slot is already booked.'
    }));

    fixture.detectChanges();
    enterValidBooking();

    component.submit();

    expect(component.error)
      .toBe('This time slot is already booked.');
    expect(component.busy).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl)
      .not.toHaveBeenCalled();
    expect(sessionStorage.getItem('selectcutz_booking_confirmation'))
      .toBeNull();
  });

  it('shows connection errors and stops loading', () => {
    api.createBooking.mockReturnValue(
      throwError(() => new Error('Connection failed.'))
    );

    fixture.detectChanges();
    enterValidBooking();

    component.submit();

    expect(component.error).toBe('Connection failed.');
    expect(component.busy).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl)
      .not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while a request is pending', () => {
    const pending = new Subject<{
      success: boolean;
      bookingId: number;
    }>();

    api.createBooking.mockReturnValue(pending.asObservable());

    fixture.detectChanges();
    enterValidBooking();

    component.submit();
    component.submit();

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    expect(component.busy).toBe(true);

    pending.complete();

    expect(component.busy).toBe(false);
  });
});
