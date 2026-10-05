import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';
@Component({ selector:'app-admin-reports', standalone:true, imports:[CommonModule,RouterLink,SiteHeaderComponent], templateUrl:'./admin-reports.page.html', styleUrls:['../dashboard/dashboard.page.scss'] })
export class AdminReportsPage implements OnInit {
  summary:any=null; popularServices:any[]=[]; customerActivity:any[]=[]; loading=true; error='';
  constructor(public auth:AuthService,private api:ApiService,private router:Router){}
  ngOnInit():void { if(this.auth.user?.type!=='admin'){this.router.navigateByUrl('/login');return;} this.api.adminReports().subscribe({next:d=>{this.summary=d.summary||{};this.popularServices=d.popularServices||[];this.customerActivity=d.customerActivity||[];this.loading=false;},error:e=>{this.error=e.message;this.loading=false;}}); }
  logout():void{this.auth.logout();this.router.navigateByUrl('/home');}
}
