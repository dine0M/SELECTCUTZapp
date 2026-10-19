import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { finalize, timeout } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';

interface CustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  profile?: CustomerProfile;
  requiresLogin?: boolean;
}

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    SiteHeaderComponent
  ],
  template: `
    <app-site-header></app-site-header>

    <ion-content>
      <main>
        <a routerLink="/dashboard">Back to my bookings</a>
        <h1>My Settings</h1>

        <p role="alert" class="error" *ngIf="error">{{ error }}</p>
        <p role="status" class="success" *ngIf="message">{{ message }}</p>
        <p *ngIf="loading">Loading your settings...</p>

        <button
          type="button"
          *ngIf="!loading && !loaded"
          (click)="loadProfile()"
        >
          Retry
        </button>

        <div *ngIf="loaded">
          <section>
            <h2>Personal details</h2>

            <form (ngSubmit)="saveProfile()" novalidate>
              <label for="profile-name">Full name</label>
              <input
                id="profile-name"
                name="fullName"
                [(ngModel)]="fullName"
                autocomplete="name"
                maxlength="100"
                required
              >

              <label for="profile-email">Email</label>
              <input
                id="profile-email"
                [value]="email"
                type="email"
                readonly
              >
              <p class="hint">
                Your sign-in email cannot be changed here.
              </p>

              <label for="profile-phone">Phone number</label>
              <input
                id="profile-phone"
                name="phone"
                [(ngModel)]="phone"
                type="tel"
                autocomplete="tel"
                maxlength="20"
                required
              >

              <button type="submit" [disabled]="busy">
                {{ busy ? 'Please wait...' : 'Save details' }}
              </button>
            </form>
          </section>

          <section>
            <h2>Change password</h2>
            <p class="hint">
              Use 12–72 ASCII characters, or an equivalent password
              of 12–72 bytes. You will sign in again after changing it.
            </p>

            <form (ngSubmit)="changePassword()" novalidate>
              <label for="current-password">Current password</label>
              <input
                id="current-password"
                name="currentPassword"
                [(ngModel)]="currentPassword"
                type="password"
                autocomplete="current-password"
                required
              >

              <label for="new-password">New password</label>
              <input
                id="new-password"
                name="newPassword"
                [(ngModel)]="newPassword"
                type="password"
                autocomplete="new-password"
                required
              >

              <label for="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
              >

              <button type="submit" [disabled]="busy">
                {{ busy ? 'Please wait...' : 'Change password' }}
              </button>
            </form>
          </section>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    ion-content { --background: #111; --color: #f5f5f5; }
    main {
      max-width: 680px;
      margin: 0 auto;
      padding: 24px 18px 48px;
    }
    a { color: #e3bd62; }
    h1, h2 { color: #e3bd62; }
    section {
      margin-top: 26px;
      padding-top: 12px;
      border-top: 1px solid #444;
    }
    label { display: block; margin: 16px 0 6px; }
    input {
      box-sizing: border-box;
      width: 100%;
      padding: 12px;
      border: 1px solid #777;
      border-radius: 6px;
      background: #222;
      color: #fff;
      font: inherit;
    }
    input:focus { outline: 2px solid #e3bd62; }
    input[readonly] { color: #bbb; }
    button {
      margin-top: 18px;
      padding: 12px 20px;
      min-height: 44px;
      border: 0;
      border-radius: 6px;
      background: #e3bd62;
      color: #111;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: .6; cursor: wait; }
    .hint { color: #ccc; font-size: .9rem; line-height: 1.5; }
    .error { color: #ffb3b3; }
    .success { color: #a5e6b5; }
  `]
})
export class CustomerSettingsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  phone = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = true;
  loaded = false;
  busy = false;
  error = '';
  message = '';

  ngOnInit(): void {
    if (this.auth.user?.type !== 'customer') {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadProfile();
  }

  private options() {
    const token = localStorage.getItem('selectcutz_session');
    const headers: Record<string, string> = {};

    if (token) {
      headers['X-Session-Token'] = token;
    }

    return { withCredentials: true, headers };
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.http.get<ProfileResponse>(
      `${this.api.baseUrl}/profile.php`,
      this.options()
    ).pipe(
      timeout(10000),
      finalize(() => this.loading = false)
    ).subscribe({
      next: response => {
        if (!response.success || !response.profile) {
          this.error = response.message || 'Unable to load your profile.';
          return;
        }

        this.fullName = response.profile.fullName;
        this.email = response.profile.email;
        this.phone = response.profile.phone;
        this.loaded = true;
      },
      error: error => this.showError(error)
    });
  }

  saveProfile(): void {
    if (this.busy || !this.loaded) return;

    this.error = '';
    this.message = '';

    const name = this.fullName.trim();
    const phone = this.phone.trim();

    if (
      !name ||
      new TextEncoder().encode(name).length > 100 ||
      !/^\+?[0-9 ()-]{7,20}$/.test(phone)
    ) {
      this.error = 'Enter a valid name and phone number.';
      return;
    }

    this.busy = true;

    this.http.post<ProfileResponse>(
      `${this.api.baseUrl}/profile.php`,
      { action: 'updateProfile', fullName: name, phone },
      this.options()
    ).pipe(
      timeout(10000),
      finalize(() => this.busy = false)
    ).subscribe({
      next: response => {
        if (!response.success || !response.profile) {
          this.error = response.message || 'Unable to update profile.';
          return;
        }

        this.fullName = response.profile.fullName;
        this.phone = response.profile.phone;

        const user = this.auth.user;
        if (user) {
          this.auth.setUser({
            ...user,
            name: response.profile.fullName
          });
        }

        this.message = response.message || 'Profile updated.';
      },
      error: error => this.showError(error)
    });
  }

  changePassword(): void {
    if (this.busy || !this.loaded) return;

    this.error = '';
    this.message = '';

    const bytes = new TextEncoder().encode(this.newPassword).length;

    if (!this.currentPassword || bytes < 12 || bytes > 72) {
      this.error = 'Enter your current password and a new password of 12–72 bytes.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'The new passwords do not match.';
      return;
    }

    if (this.newPassword === this.currentPassword) {
      this.error = 'Choose a password different from your current one.';
      return;
    }

    this.busy = true;

    this.http.post<ProfileResponse>(
      `${this.api.baseUrl}/profile.php`,
      {
        action: 'changePassword',
        currentPassword: this.currentPassword,
        newPassword: this.newPassword
      },
      this.options()
    ).pipe(
      timeout(10000),
      finalize(() => this.busy = false)
    ).subscribe({
      next: response => {
        if (!response.success) {
          this.error = response.message || 'Unable to change password.';
          return;
        }

        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';

        this.auth.logout();
        window.alert(response.message || 'Password changed. Please sign in again.');
        this.router.navigateByUrl('/login');
      },
      error: error => this.showError(error)
    });
  }

  private showError(error: HttpErrorResponse | Error): void {
    const response = error as HttpErrorResponse;

    this.error = error.name === 'TimeoutError'
      ? 'The server took too long to respond. Please try again.'
      : response.error?.message ||
        (response.status === 0
          ? 'Cannot reach the server. Check that the API and database are running.'
          : 'Unable to process your request. Please try again.');
  }
}
