import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesPage } from './services.page';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('ServicesPage', () => {
  let component: ServicesPage;
  let fixture: ComponentFixture<ServicesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ServicesPage], providers: [provideRouter([]), provideHttpClient()] }).compileComponents();
    fixture = TestBed.createComponent(ServicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
