import { Component, OnInit } from '@angular/core';
import { ApiService, SiteSettings } from '../core/api.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div>
        <h3>{{ site.SiteName }}</h3>
        <p>We pride ourselves on delivering quality workmanship, excellent customer care, and styles tailored to each client's needs.</p>
      </div>
      <div>
        <h3>Contact</h3>
        <p>📍 {{ site.Address }}</p>
        <p>📞 Phone: {{ site.ContactPhone }}</p>
        <p>✉ Email: {{ site.ContactEmail }}</p>
        <p>🕒 Hours: {{ site.BusinessHours }}</p>
        <a class="location" target="_blank" rel="noopener"
           href="https://maps.google.com/?q=12+344+Francis+Baard+St+Pretoria+Central+Pretoria+0002+South+Africa">
          View Location
        </a>
      </div>
    </footer>
    <div class="copyright">© 2026 SELECT CUTZ. All Rights Reserved.</div>
  `,
  styles: [`
    .footer { background:#050505; border-top:1px solid #333; padding:40px 6%; display:grid; grid-template-columns:1fr 1fr; gap:40px; color:#ddd; }
    h3 { color:#d6a832; }
    p { line-height:1.6; }
    .location { display:inline-block; background:#d6a832; color:#111; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:700; }
    .copyright { background:#000; color:#999; border-top:1px solid #222; padding:15px; text-align:center; }
    @media(max-width:700px) { .footer { grid-template-columns:1fr; padding:30px 20px; } }
  `]
})
export class SiteFooterComponent implements OnInit {
  site: SiteSettings = {
    SiteName:'SELECT CUTZ', LogoPath:'assets/logo.jpg', OwnerName:'Tshego',
    OwnerTitle:'Founder & Professional Barber',
    OwnerBio:'', OwnerPhoto:'assets/owner.jpeg',
    ContactEmail:'tshegofatso@gmail.com', ContactPhone:'+27 64 842 6381',
    Address:'Container 12, 344 Francis Baard St, Pretoria Central, Pretoria, 0002, South Africa',
    BusinessHours:'Mon - Sat: 08:00 - 18:00'
  };
  constructor(private api: ApiService) {}
  ngOnInit(): void { this.api.settings().subscribe({ next: s => this.site = { ...this.site, ...s } }); }
}
