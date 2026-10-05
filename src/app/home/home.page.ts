import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { ApiService, ServiceItem } from '../core/api.service';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { LOCAL_SERVICES, serviceImage } from '../core/catalog';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonContent, IonButton, RouterLink, SiteHeaderComponent, SiteFooterComponent]
})
export class HomePage implements OnInit {
  services: ServiceItem[] = [];
  loading = true;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.services().subscribe({
      next: (data) => {
        this.services = Array.isArray(data) && data.length ? data.slice(0, 3) : LOCAL_SERVICES.slice(0, 3);
        this.loading = false;
      },
      error: () => {
        this.services = LOCAL_SERVICES.slice(0, 3);
        this.loading = false;
      }
    });
  }

  book(serviceId?: number): void {
    this.router.navigate(['/booking'], { queryParams: serviceId ? { service: serviceId } : {} });
  }

  imageUrl(path?: string): string {
    return serviceImage(path);
  }
}
