import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LoginPage } from './login.page';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let navigate: ReturnType<typeof vi.spyOn>;

  let auth: {
    user: null;
    login: ReturnType<typeof vi.fn>;
    setUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    sessionStorage.removeItem('selectcutz_return_url');

    auth = {
      user: null,
      login: vi.fn().mockReturnValue(of({
        success: true,
        user: {
          id: 1,
          name: 'Test Customer',
          role: 'customer'
        }
      })),
      setUser: vi.fn(),
      logout: vi.fn()
    };

    const api = {
      settings: vi.fn().mockReturnValue(of({
        SiteName: 'SELECT CUTZ',
        LogoPath: 'assets/logo.jpg'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api }
      ]
    }).compileComponents();

    navigate = vi.spyOn(
      TestBed.inject(Router),
      'navigateByUrl'
    ).mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('selectcutz_return_url');
    vi.restoreAllMocks();
  });

  it('rejects missing login details without calling the API', () => {
    component.username = '';
    component.password = '';

    component.submit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(component.error)
      .toBe('Please enter your username/email and password.');
    expect(component.busy).toBe(false);
  });

  it('logs in a customer and opens the dashboard', async () => {
    component.username = ' customer@example.test ';
    component.password = 'CustomerPassword123!';
    component.type = 'customer';

    component.submit();
    await Promise.resolve();

    expect(auth.login).toHaveBeenCalledWith(
      'customer@example.test',
      'CustomerPassword123!',
      'customer'
    );

    expect(auth.setUser).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Customer',
      type: 'customer',
      username: 'customer@example.test'
    });

    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(component.busy).toBe(false);
    expect(component.password).toBe('');
  });

  it('logs in an administrator and opens the dashboard', async () => {
    auth.login.mockReturnValue(of({
      success: true,
      user: {
        id: 2,
        name: 'Test Admin',
        role: 'admin'
      }
    }));

    component.username = 'admin@example.test';
    component.password = 'AdminPassword123!';
    component.type = 'admin';

    component.submit();
    await Promise.resolve();

    expect(auth.login).toHaveBeenCalledWith(
      'admin@example.test',
      'AdminPassword123!',
      'admin'
    );

    expect(auth.setUser).toHaveBeenCalledWith({
      id: 2,
      name: 'Test Admin',
      type: 'admin',
      username: 'admin@example.test'
    });

    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(component.busy).toBe(false);
  });

  it('shows rejected login details without navigating', () => {
    auth.login.mockReturnValue(of({
      success: false,
      message: 'Invalid login details.'
    }));

    component.username = 'customer@example.test';
    component.password = 'IncorrectPassword';

    component.submit();

    expect(component.error).toBe('Invalid login details.');
    expect(auth.setUser).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('shows connection errors and stops loading', () => {
    auth.login.mockReturnValue(
      throwError(() => new Error('Server unavailable.'))
    );

    component.username = 'customer@example.test';
    component.password = 'CustomerPassword123!';

    component.submit();

    expect(component.error).toBe('Server unavailable.');
    expect(component.busy).toBe(false);
    expect(auth.setUser).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('rejects a successful response with an invalid user role', () => {
    auth.login.mockReturnValue(of({
      success: true,
      user: {
        id: 1,
        name: 'Unknown User',
        role: 'unknown'
      }
    }));

    component.username = 'customer@example.test';
    component.password = 'CustomerPassword123!';

    component.submit();

    expect(component.error)
      .toBe('The server returned an invalid login response.');
    expect(auth.setUser).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });
});
