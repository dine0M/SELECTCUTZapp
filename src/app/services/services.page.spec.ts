import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ServicesPage } from './services.page';
import { ApiService, ServiceItem } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LOCAL_SERVICES } from '../core/catalog';

describe('ServicesPage', () => {
  let component: ServicesPage;
  let fixture: ComponentFixture<ServicesPage>;

  let api: {
    services: ReturnType<typeof vi.fn>;
    settings: ReturnType<typeof vi.fn>;
  };

  const testServices: ServiceItem[] = [{
    ServiceID: 101,
    ServiceName: 'Test Fade',
    Description: 'Test service',
    Price: 150,
    Duration: 30,
    ServiceImage: 'assets/classic-fade.jpeg'
  }];

  beforeEach(async () => {
    api = {
      services: vi.fn().mockReturnValue(of(testServices)),
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
      imports: [ServicesPage],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            user: null,
            logout: vi.fn()
          }
        }
      ]
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    fixture = TestBed.createComponent(ServicesPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('loads the services supplied by the API', () => {
    fixture.detectChanges();

    expect(api.services).toHaveBeenCalledTimes(1);
    expect(component.services).toEqual(testServices);
    expect(component.loading).toBe(false);
  });

  it('uses local services when the API returns no services', () => {
    api.services.mockReturnValue(of([]));

    fixture.detectChanges();

    expect(component.services).toEqual(LOCAL_SERVICES);
    expect(component.loading).toBe(false);
  });

  it('uses local services when the API request fails', () => {
    api.services.mockReturnValue(
      throwError(() => new Error('Server unavailable.'))
    );

    fixture.detectChanges();

    expect(component.services).toEqual(LOCAL_SERVICES);
    expect(component.loading).toBe(false);
  });

  it('opens booking with the selected service ID', () => {
    fixture.detectChanges();

    component.bookService(101);

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/booking'],
      { queryParams: { service: 101 } }
    );
  });

  it('replaces a failed service image with the default logo', () => {
    const image = document.createElement('img');
    image.src = 'assets/missing-image.jpg';

    image.addEventListener('error', event => {
      component.imageError(event);
    });

    image.dispatchEvent(new Event('error'));

    expect(image.getAttribute('src')).toBe('assets/logo.jpg');
  });

  it('preserves an absolute service image URL', () => {
    const url = 'https://example.test/service.jpg';

    expect(component.imageUrl(url)).toBe(url);
  });
});
