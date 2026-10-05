import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService, ServiceItem } from '../core/api.service';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { LOCAL_SERVICES, serviceImage } from '../core/catalog';

@Component({
  selector: 'app-services',
  standalone: true,
  templateUrl: './services.page.html',
  styleUrls: ['./services.page.scss'],
  imports: [CommonModule, IonContent, IonButton, SiteHeaderComponent, SiteFooterComponent]
})
export class ServicesPage implements OnInit {
  services: ServiceItem[] = LOCAL_SERVICES;
  loading = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.api.services().subscribe({
      next: data => { this.services = Array.isArray(data) && data.length ? data : LOCAL_SERVICES; this.loading = false; },
      error: () => {
        this.services = LOCAL_SERVICES;
        this.error = '';
        this.loading = false;
      }
    });
  }

  bookService(serviceId: number): void {
    this.router.navigate(['/booking'], { queryParams: { service: serviceId } });
  }

  imageUrl(path?: string): string {
    return serviceImage(path);
  }

  imageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/logo.jpg';
  }
}
