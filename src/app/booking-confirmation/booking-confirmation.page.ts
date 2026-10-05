import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';

interface BookingConfirmation {
  bookingId: number;
  customerName: string;
  serviceName: string;
  price: number | string;
  date: string;
  time: string;
  status: string;
  message: string;
}

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  templateUrl: './booking-confirmation.page.html',
  styleUrls: ['./booking-confirmation.page.scss'],
  imports: [CommonModule, IonButton, IonContent, RouterLink, SiteHeaderComponent, SiteFooterComponent]
})
export class BookingConfirmationPage {
  confirmation: BookingConfirmation | null = null;

  constructor(private router: Router) {
    try {
      const stored = sessionStorage.getItem('selectcutz_booking_confirmation');
      this.confirmation = stored ? JSON.parse(stored) as BookingConfirmation : null;
    } catch {
      this.confirmation = null;
    }
    if (!this.confirmation) this.router.navigateByUrl('/dashboard');
  }
}
