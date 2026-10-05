import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton } from '@ionic/angular';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { serviceImage } from '../core/catalog';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, RouterLink, RouterLinkActive],
  template: `
    <ion-header class="site-header">
      <ion-toolbar>
        <div class="navbar">
          <a class="brand" routerLink="/home">
            <img [src]="logo" alt="SELECT CUTZ Logo">
            <div class="brand-text">
              <h1>SELECT CUTZ</h1>
              <span>Hair Salon</span>
            </div>
          </a>

          <div class="nav-links">
            <a routerLink="/home" routerLinkActive="active">Home</a>
            <a routerLink="/services" routerLinkActive="active">Services</a>
            <a routerLink="/owner" routerLinkActive="active">Owner</a>
            <a routerLink="/booking" routerLinkActive="active">Book</a>
            @if (auth.user) {
              <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
              <button type="button" (click)="logout()">Logout</button>
            } @else {
              <a routerLink="/login" routerLinkActive="active">Login</a>
            }
          </div>

          <ion-buttons class="mobile-menu">
            <ion-menu-button menu="main-menu" aria-label="Open navigation menu"></ion-menu-button>
          </ion-buttons>
        </div>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .site-header, ion-toolbar { --background: #050505; --color: white; }
    .site-header { position:relative; z-index:20; }
    .navbar { min-height:84px; display:flex; align-items:center; justify-content:space-between; padding:0 42px; border-bottom:1px solid #333; }
    .brand { display:flex; align-items:center; gap:12px; text-decoration:none; color:white; }
    .brand img { width:52px; height:52px; object-fit:cover; border-radius:12px; border:2px solid #d6a832; }
    .brand-text h1 { margin:0; color:white; font-size:24px; font-weight:700; }
    .brand-text span { color:#d6a832; font-size:14px; }
    .nav-links { display:flex; gap:24px; }
    .nav-links a,.nav-links button { color:white; background:transparent; border:0; padding:8px 0; text-decoration:none; font:700 16px/1 Arial,Helvetica,sans-serif; cursor:pointer; }
    .nav-links a:hover,.nav-links a:focus-visible,.nav-links button:hover,.nav-links button:focus-visible,.nav-links .active { color:#d6a832; }
    .mobile-menu { display:none; }
    @media(max-width:768px) {
      .navbar { min-height:70px; padding:10px 16px; }
      .brand img { width:46px; height:46px; }
      .brand-text h1 { font-size:19px; }
      .brand-text span { font-size:12px; }
      .nav-links { display:none; }
      .mobile-menu { display:flex; }
    }
  `]
})
export class SiteHeaderComponent implements OnInit {
  logo = 'assets/logo.jpg';
  constructor(public auth: AuthService, private router: Router, private api: ApiService) {}
  ngOnInit(): void { this.api.settings().subscribe({ next: site => this.logo = serviceImage(site.LogoPath) }); }
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }
}
