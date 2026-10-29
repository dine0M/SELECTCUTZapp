import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { OwnerPage } from './owner.page';
import { ApiService, SiteSettings } from '../core/api.service';
import { AuthService } from '../core/auth.service';

describe('OwnerPage', () => {
  let component: OwnerPage;
  let fixture: ComponentFixture<OwnerPage>;

  let settings: ReturnType<typeof vi.fn>;

  const testSettings: SiteSettings = {
    SiteName: 'Test Salon',
    LogoPath: 'assets/logo.jpg',
    OwnerName: 'Test Owner',
    OwnerTitle: 'Professional Barber',
    OwnerBio: 'A biography supplied by the test API.',
    OwnerPhoto: 'assets/owner.jpeg',
    ContactEmail: 'salon@example.test',
    ContactPhone: '0123456789',
    Address: 'Test address',
    BusinessHours: 'Mon - Sat: 08:00 - 18:00'
  };

  beforeEach(async () => {
    settings = vi.fn().mockReturnValue(of(testSettings));

    await TestBed.configureTestingModule({
      imports: [OwnerPage],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: { settings }
        },
        {
          provide: AuthService,
          useValue: {
            user: null,
            logout: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('loads the owner details supplied by the API', () => {
    fixture.detectChanges();

    expect(settings).toHaveBeenCalled();
    expect(component.site.OwnerName).toBe('Test Owner');
    expect(component.site.OwnerTitle).toBe('Professional Barber');
    expect(component.site.OwnerBio)
      .toBe('A biography supplied by the test API.');
  });

  it('preserves default values when settings are partial', () => {
    settings.mockReturnValue(of({
      OwnerName: 'Updated Owner'
    }));

    const originalTitle = component.site.OwnerTitle;
    const originalAddress = component.site.Address;

    fixture.detectChanges();

    expect(component.site.OwnerName).toBe('Updated Owner');
    expect(component.site.OwnerTitle).toBe(originalTitle);
    expect(component.site.Address).toBe(originalAddress);
  });

  it('uses the default owner image when the path is empty', () => {
    expect(component.imageUrl('')).toBe('assets/owner.jpeg');
  });

  it('preserves an absolute owner image URL', () => {
    const url = 'https://example.test/owner.jpg';

    expect(component.imageUrl(url)).toBe(url);
  });
});
