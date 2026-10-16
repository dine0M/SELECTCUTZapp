import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, Booking } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, IonButton, RouterLink, SiteHeaderComponent]
})
export class DashboardPage implements OnInit {
  bookings: Booking[] = [];
  notifications: {
    Message: string;
    NotificationDate: string;
  }[] = [];

  summary: any = null;
  loading = true;
  saving = false;
  error = '';
  message = '';

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.user;

    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (user.type === 'admin') {
      this.loadAdmin();
    } else {
      this.loadCustomer();
    }
  }

  loadCustomer(): void {
    const user = this.auth.user;
    if (!user || user.type !== 'customer') return;

    this.loading = true;
    this.error = '';

    this.api.customerData(user.id).subscribe({
      next: data => {
        this.bookings = Array.isArray(data?.bookings)
          ? data.bookings
          : [];

        this.notifications = Array.isArray(data?.notifications)
          ? data.notifications
          : [];

        this.loading = false;
      },
      error: err => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  loadAdmin(): void {
    if (this.auth.user?.type !== 'admin') return;

    this.loading = true;
    this.error = '';

    forkJoin({
      reports: this.api.adminReports(),
      bookings: this.api.adminBookings()
    }).subscribe({
      next: data => {
        this.summary = data.reports?.summary || {};
        this.bookings = Array.isArray(data.bookings)
          ? data.bookings
          : [];

        this.loading = false;
      },
      error: err => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  canCancel(booking: Booking): boolean {
    if (booking.BookingStatus !== 'Confirmed') return false;

    // Booking dates and times belong to South African time.
    const appointment = new Date(
      `${booking.BookingDate}T${booking.BookingTime}+02:00`
    );

    return Number.isFinite(appointment.getTime()) &&
      appointment.getTime() > Date.now();
  }

  cancel(bookingId: number): void {
    const user = this.auth.user;

    if (
      !user ||
      user.type !== 'customer' ||
      this.saving ||
      !confirm('Cancel this booking?')
    ) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.message = '';

    this.api.cancelBooking(user.id, bookingId).subscribe({
      next: response => {
        this.saving = false;

        if (!response?.success) {
          this.error = response?.message || 'Unable to cancel booking.';
          return;
        }

        this.message = response.message || 'Booking cancelled.';
        this.loadCustomer();
      },
      error: err => {
        this.saving = false;
        this.error = err.message;
      }
    });
  }

  complete(bookingId: number): void {
    if (
      this.auth.user?.type !== 'admin' ||
      this.saving ||
      !confirm('Mark this appointment as completed?')
    ) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.message = '';

    this.api.completeBooking(bookingId).subscribe({
      next: response => {
        this.saving = false;

        if (!response?.success) {
          this.error = response?.message || 'Unable to complete booking.';
          return;
        }

        this.message = response.message || 'Booking completed.';
        this.loadAdmin();
      },
      error: err => {
        this.saving = false;
        this.error = err.message;
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }
}
