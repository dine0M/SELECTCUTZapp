import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, RouterLink, SiteHeaderComponent, SiteFooterComponent]
})
export class LoginPage {
  username = '';
  password = '';
  type: 'customer' | 'admin' = 'customer';
  message = '';
  error = '';
  busy = false;
  returnUrl = '/dashboard';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || sessionStorage.getItem('selectcutz_return_url') || '/dashboard';
  }

  submit(): void {
    if (this.busy) return;
    this.message = '';
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Please enter your username/email and password.';
      return;
    }
    this.busy = true;
    this.auth.login(this.username.trim(), this.password, this.type).pipe(
      finalize(() => this.busy = false)
    ).subscribe({
      next: response => {
        if (!response?.success) {
          this.error = response?.message || 'Invalid login details.';
          return;
        }
        const user = response.user;
        this.auth.setUser({
          id: Number(user.id),
          name: String(user.name),
          type: this.type,
          username: this.username.trim()
        });
        const destination = this.type === 'admin' ? '/dashboard' : this.returnUrl;
        sessionStorage.removeItem('selectcutz_return_url');
        this.router.navigateByUrl(destination);
      },
      error: err => { this.error = err.message; }
    });
  }
}
