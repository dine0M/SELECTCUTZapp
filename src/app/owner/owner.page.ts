import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ApiService, SiteSettings } from '../core/api.service';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { serviceImage } from '../core/catalog';

@Component({
  selector: 'app-owner',
  standalone: true,
  templateUrl: './owner.page.html',
  styleUrls: ['./owner.page.scss'],
  imports: [CommonModule, IonContent, IonButton, RouterLink, SiteHeaderComponent, SiteFooterComponent]
})
export class OwnerPage implements OnInit {
  site: SiteSettings = {
    SiteName:'SELECT CUTZ', LogoPath:'assets/uploads/logo.jpg', OwnerName:'Tshego',
    OwnerTitle:'Founder & Professional Barber',
    OwnerBio:'Tshego is the founder of SELECT CUTZ, a modern barber and salon business dedicated to delivering professional grooming services and exceptional customer experiences. With a passion for style, precision, and customer satisfaction, he established SELECT CUTZ to provide clients with quality haircuts, beard grooming, and modern hairstyling services in a welcoming environment.',
    OwnerPhoto:'assets/uploads/owner.jpeg', ContactEmail:'tshegofatso@gmail.com',
    ContactPhone:'+27 64 842 6381', Address:'Container 12, 344 Francis Baard St, Pretoria Central, Pretoria, 0002, South Africa',
    BusinessHours:'Mon - Sat: 08:00 - 18:00'
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.settings().subscribe({ next: s => this.site = { ...this.site, ...s } });
  }

  imageUrl(path: string): string {
    return serviceImage(path || 'assets/owner.jpeg');
  }
}
