import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    RouterLink,
    SiteHeaderComponent,
    SiteFooterComponent
  ]
})
export class LoginPage {
  username = '';
  password = '';
  type: 'customer' | 'admin' = 'customer';
  message = '';
  error = '';
  busy = false;
  returnUrl = '/dashboard';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const requestedUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ||
      sessionStorage.getItem('selectcutz_return_url') ||
      '/dashboard';

    this.returnUrl =
      requestedUrl.startsWith('/') &&
      !requestedUrl.startsWith('//') &&
      !requestedUrl.startsWith('/login')
        ? requestedUrl
        : '/dashboard';
  }

  submit(): void {
    if (this.busy) return;

    this.message = '';
    this.error = '';

    const username = this.username.trim();
    const accountType = this.type;

    if (!username || !this.password) {
      this.error = 'Please enter your username/email and password.';
      return;
    }

    this.busy = true;

    this.auth.login(username, this.password, accountType).pipe(
      finalize(() => {
        this.busy = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: response => {
        if (!response?.success) {
          this.error = response?.message || 'Invalid login details.';
          this.cdr.markForCheck();
          return;
        }

        const user = response.user;
        const role = user?.role;
        const id = Number(user?.id);

        if (
          !Number.isInteger(id) ||
          id < 1 ||
          (role !== 'admin' && role !== 'customer')
        ) {
          this.error = 'The server returned an invalid login response.';
          this.cdr.markForCheck();
          return;
        }

        this.auth.setUser({
          id,
          name: String(user.name || username),
          type: role,
          username
        });

        this.password = '';
        sessionStorage.removeItem('selectcutz_return_url');

        const destination =
          role === 'admin' ? '/dashboard' : this.returnUrl;

        void this.router.navigateByUrl(destination).then(
          navigated => {
            if (!navigated) {
              this.error =
                'Login succeeded, but the dashboard could not open. ' +
                'Please open Dashboard from the menu.';
              this.cdr.markForCheck();
            }
          },
          () => {
            this.error =
              'Login succeeded, but navigation failed. ' +
              'Please open Dashboard from the menu.';
            this.cdr.markForCheck();
          }
        );
      },
      error: err => {
        this.error =
          err?.message || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
