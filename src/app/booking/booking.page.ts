import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService, ServiceItem } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { LOCAL_SERVICES } from '../core/catalog';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-booking',
  standalone: true,
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, SiteHeaderComponent, SiteFooterComponent]
})
export class BookingPage implements OnInit {
  services: ServiceItem[] = [];
  serviceId = 0;
  date = '';
  time = '';
  error = '';
  message = '';
  busy = false;
  minDate = new Date().toISOString().slice(0, 10);

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.user || this.auth.user.type !== 'customer') {
      sessionStorage.setItem('selectcutz_return_url', '/booking');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/booking' } });
      return;
    }
    this.serviceId = 0;
    this.api.services().subscribe({
      next: data => {
        this.services = Array.isArray(data) && data.length ? data : LOCAL_SERVICES;
      },
      error: () => {
        this.services = LOCAL_SERVICES;
      }
    });
  }

  submit(): void {
    if (this.busy) return;
    this.error = '';
    this.message = '';
    const user = this.auth.user;

    if (!user || user.type !== 'customer') {
      sessionStorage.setItem('selectcutz_return_url', '/booking');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/booking' } });
      return;
    }
    if (!this.serviceId || !this.date || !this.time) {
      this.error = 'Please select a service, date and time.';
      return;
    }
    if (this.date < this.minDate) {
      this.error = 'Please choose today or a future date.';
      return;
    }

    this.busy = true;
    this.api.createBooking(user.id, this.serviceId, this.date, this.time).pipe(
      finalize(() => this.busy = false)
    ).subscribe({
      next: response => {
        if (!response?.success) {
          this.error = response?.message || 'Booking could not be created.';
          return;
        }
        const service = this.services.find(item => Number(item.ServiceID) === Number(this.serviceId));
        const confirmation = {
          bookingId: Number(response.bookingId || 0),
          customerName: user.name,
          serviceName: service?.ServiceName || 'Selected service',
          price: service?.Price ?? '',
          date: this.date,
          time: this.time,
          status: 'Confirmed',
          message: response.message || 'Booking confirmed successfully.'
        };
        sessionStorage.setItem('selectcutz_booking_confirmation', JSON.stringify(confirmation));
        this.router.navigateByUrl('/booking-confirmation');
      },
      error: err => { this.error = err.message; }
    });
  }
}
