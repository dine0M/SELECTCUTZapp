import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'home', title: 'SELECT CUTZ | Home', loadComponent: () => import('./home/home.page').then((m) => m.HomePage) },
  { path: 'services', title: 'Services | SELECT CUTZ', loadComponent: () => import('./services/services.page').then((m) => m.ServicesPage) },
  { path: 'owner', title: 'Meet the Owner | SELECT CUTZ', loadComponent: () => import('./owner/owner.page').then((m) => m.OwnerPage) },
  { path: 'login', title: 'Login | SELECT CUTZ', loadComponent: () => import('./login/login.page').then((m) => m.LoginPage) },
  { path: 'register', title: 'Register | SELECT CUTZ', loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage) },
  { path: 'booking', title: 'Book an Appointment | SELECT CUTZ', loadComponent: () => import('./booking/booking.page').then((m) => m.BookingPage) },
  { path: 'booking-confirmation', title: 'Booking Confirmed | SELECT CUTZ', loadComponent: () => import('./booking-confirmation/booking-confirmation.page').then((m) => m.BookingConfirmationPage) },
  { path: 'dashboard', title: 'Dashboard | SELECT CUTZ', loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage) },
  { path: 'admin/services', title: 'Manage Services | SELECT CUTZ', loadComponent: () => import('./admin-services/admin-services.page').then((m) => m.AdminServicesPage) },
  { path: 'admin/site', title: 'Logo & Owner | SELECT CUTZ', loadComponent: () => import('./admin-site/admin-site.page').then((m) => m.AdminSitePage) },
  { path: 'admin/reports', title: 'Reports | SELECT CUTZ', loadComponent: () => import('./admin-reports/admin-reports.page').then((m) => m.AdminReportsPage) },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
