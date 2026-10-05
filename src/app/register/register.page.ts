import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonButton, RouterLink, SiteHeaderComponent, SiteFooterComponent]
})
export class RegisterPage {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  error = '';
  message = '';
  busy = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.busy) return;
    this.error = '';
    this.message = '';
    if (!this.name.trim() || !this.email.trim() || !this.phone.trim() || !this.password) {
      this.error = 'Please complete all fields.';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must contain at least 6 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.busy = true;
    this.auth.register(this.name.trim(), this.email.trim().toLowerCase(), this.phone.trim(), this.password).pipe(
      finalize(() => this.busy = false)
    ).subscribe({
      next: response => {
        if (!response?.success) {
          this.error = response?.message || 'Registration failed.';
          return;
        }
        this.message = 'Account created successfully. You can now log in.';
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: err => { this.error = err.message; }
    });
  }
}
