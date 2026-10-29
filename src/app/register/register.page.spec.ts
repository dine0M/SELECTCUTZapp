import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RegisterPage } from './register.page';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  let auth: {
    user: null;
    register: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      user: null,
      register: vi.fn().mockReturnValue(of({
        success: true
      })),
      logout: vi.fn()
    };

    const api = {
      settings: vi.fn().mockReturnValue(of({
        SiteName: 'SELECT CUTZ',
        LogoPath: 'assets/logo.jpg',
        ContactEmail: 'salon@example.test',
        ContactPhone: '0123456789',
        Address: 'Test address',
        BusinessHours: 'Mon - Sat: 08:00 - 18:00'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api }
      ]
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function enterValidDetails(): void {
    component.name = ' Test Customer ';
    component.email = ' CUSTOMER@EXAMPLE.TEST ';
    component.phone = ' 0123456789 ';
    component.password = 'CustomerPassword123!';
    component.confirmPassword = 'CustomerPassword123!';
  }

  it('rejects incomplete registration details', () => {
    component.submit();

    expect(component.error).toBe('Please complete all fields.');
    expect(auth.register).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('rejects passwords shorter than six characters', () => {
    enterValidDetails();
    component.password = '12345';
    component.confirmPassword = '12345';

    component.submit();

    expect(component.error)
      .toBe('Password must contain at least 6 characters.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('rejects passwords that do not match', () => {
    enterValidDetails();
    component.confirmPassword = 'DifferentPassword123!';

    component.submit();

    expect(component.error).toBe('Passwords do not match.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('normalises details and redirects after successful registration', async () => {
    vi.useFakeTimers();
    enterValidDetails();

    component.submit();

    expect(auth.register).toHaveBeenCalledWith(
      'Test Customer',
      'customer@example.test',
      '0123456789',
      'CustomerPassword123!'
    );

    expect(component.message)
      .toBe('Account created successfully. You can now log in.');
    expect(component.busy).toBe(false);

    const router = TestBed.inject(Router);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('shows a rejected registration without redirecting', () => {
    auth.register.mockReturnValue(of({
      success: false,
      message: 'Email already registered.'
    }));

    enterValidDetails();
    component.submit();

    expect(component.error).toBe('Email already registered.');
    expect(component.busy).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl)
      .not.toHaveBeenCalled();
  });

  it('shows connection errors and stops loading', () => {
    auth.register.mockReturnValue(
      throwError(() => new Error('Server unavailable.'))
    );

    enterValidDetails();
    component.submit();

    expect(component.error).toBe('Server unavailable.');
    expect(component.busy).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl)
      .not.toHaveBeenCalled();
  });

  it('prevents duplicate registration requests while busy', () => {
    const pending = new Subject<{ success: boolean }>();
    auth.register.mockReturnValue(pending.asObservable());

    enterValidDetails();

    component.submit();
    component.submit();

    expect(auth.register).toHaveBeenCalledTimes(1);
    expect(component.busy).toBe(true);

    pending.complete();

    expect(component.busy).toBe(false);
  });
});
