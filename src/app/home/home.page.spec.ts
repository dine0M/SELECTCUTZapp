import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { HomePage } from './home.page';
import { ApiService, ServiceItem } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LOCAL_SERVICES } from '../core/catalog';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  let api: {
    services: ReturnType<typeof vi.fn>;
    settings: ReturnType<typeof vi.fn>;
  };

  const services: ServiceItem[] = [
    {
      ServiceID: 101,
      ServiceName: 'Test Fade',
      Description: 'First test service',
      Price: 100,
      Duration: 30
    },
    {
      ServiceID: 102,
      ServiceName: 'Test Beard Trim',
      Description: 'Second test service',
      Price: 80,
      Duration: 20
    },
    {
      ServiceID: 103,
      ServiceName: 'Test Wash',
      Description: 'Third test service',
      Price: 60,
      Duration: 15
    },
    {
      ServiceID: 104,
      ServiceName: 'Test Styling',
      Description: 'Fourth test service',
      Price: 120,
      Duration: 30
    }
  ];

  beforeEach(async () => {
    api = {
      services: vi.fn().mockReturnValue(of(services)),
      settings: vi.fn().mockReturnValue(of({
        SiteName: 'SELECT CUTZ',
        LogoPath: 'assets/logo.jpg',
        OwnerName: 'Test Owner',
        OwnerTitle: 'Barber',
        OwnerBio: 'Test salon',
        OwnerPhoto: 'assets/owner.jpeg',
        ContactEmail: 'salon@example.test',
        ContactPhone: '0123456789',
        Address: 'Test address',
        BusinessHours: 'Mon - Sat: 08:00 - 18:00'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
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

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('loads only the first three services from the API', () => {
    fixture.detectChanges();

    expect(api.services).toHaveBeenCalledTimes(1);
    expect(component.services).toEqual(services.slice(0, 3));
    expect(component.loading).toBe(false);
  });

  it('uses local services when the API returns an empty list', () => {
    api.services.mockReturnValue(of([]));

    fixture.detectChanges();

    expect(component.services).toEqual(LOCAL_SERVICES.slice(0, 3));
    expect(component.loading).toBe(false);
  });

  it('uses local services when the API request fails', () => {
    api.services.mockReturnValue(
      throwError(() => new Error('Server unavailable'))
    );

    fixture.detectChanges();

    expect(component.services).toEqual(LOCAL_SERVICES.slice(0, 3));
    expect(component.loading).toBe(false);
  });

  it('opens booking with the selected service', () => {
    fixture.detectChanges();

    component.book(101);

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/booking'],
      { queryParams: { service: 101 } }
    );
  });

  it('opens booking without a preselected service', () => {
    fixture.detectChanges();

    component.book();

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/booking'],
      { queryParams: {} }
    );
  });
});
