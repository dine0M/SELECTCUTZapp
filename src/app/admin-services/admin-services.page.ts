import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { ApiService, ServiceItem } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { serviceImage } from '../core/catalog';
import { optimizedImageData } from '../core/image-upload';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({
  selector: 'app-admin-services', standalone: true,
  imports: [CommonModule, FormsModule, IonButton, RouterLink, SiteHeaderComponent],
  templateUrl: './admin-services.page.html',
  styleUrls: ['../dashboard/dashboard.page.scss', './admin-services.page.scss']
})
export class AdminServicesPage implements OnInit {
  services: ServiceItem[] = [];
  model = { name:'', description:'', price:0, duration:30, category:'Haircut', image:'', imageData:'', imageName:'' };
  preview = '';
  busy = false; loading = true; error = ''; message = '';

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}
  ngOnInit(): void { if (!this.requireAdmin()) return; this.loadServices(); }
  requireAdmin(): boolean { if (this.auth.user?.type === 'admin') return true; this.router.navigateByUrl('/login'); return false; }
  loadServices(): void {
    this.loading = true;
    this.api.services().subscribe({
      next: data => { this.services = Array.isArray(data) ? data : []; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; }
    });
  }
  async selectImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.error = '';
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { this.error = 'Select a JPG, PNG or WebP image.'; return; }
    if (file.size > 5 * 1024 * 1024) { this.error = 'The image must be smaller than 5 MB.'; return; }
    try { this.preview = await optimizedImageData(file); this.model.imageData = this.preview; this.model.imageName = file.name; }
    catch (error) { this.error = (error as Error).message; }
  }
  addService(): void {
    this.error = ''; this.message = '';
    if (!this.model.name.trim() || this.model.price < 0 || this.model.duration < 1 || !this.model.imageData) {
      this.error = 'Complete the service name, price, duration and select an image.'; return;
    }
    this.busy = true;
    this.api.addService(this.model).subscribe({
      next: response => {
        this.busy = false; this.message = response.message || 'Service added successfully.';
        this.model = { name:'', description:'', price:0, duration:30, category:'Haircut', image:'', imageData:'', imageName:'' };
        this.preview = ''; this.loadServices();
      },
      error: err => { this.busy = false; this.error = err.message; }
    });
  }
  deleteService(id: number): void {
    if (!confirm('Delete this service?')) return;
    this.api.deleteService(id).subscribe({ next: r => { this.message = r.message; this.loadServices(); }, error: e => this.error = e.message });
  }
  imageUrl(path?: string): string { return serviceImage(path); }
  logout(): void { this.auth.logout(); this.router.navigateByUrl('/home'); }
}
