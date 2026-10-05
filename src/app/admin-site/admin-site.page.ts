import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { ApiService, SiteSettings } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { optimizedImageData } from '../core/image-upload';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { serviceImage } from '../core/catalog';

@Component({ selector:'app-admin-site', standalone:true, imports:[CommonModule,FormsModule,IonButton,RouterLink,SiteHeaderComponent], templateUrl:'./admin-site.page.html', styleUrls:['../dashboard/dashboard.page.scss','./admin-site.page.scss'] })
export class AdminSitePage implements OnInit {
  site:SiteSettings|null=null; logoData=''; logoName=''; ownerData=''; ownerName=''; logoPreview=''; ownerPreview=''; loading=true; busy=false; error=''; message='';
  constructor(public auth:AuthService,private api:ApiService,private router:Router){}
  ngOnInit():void { if(this.auth.user?.type!=='admin'){this.router.navigateByUrl('/login');return;} this.api.settings().subscribe({next:s=>{this.site=s;this.logoPreview=this.mediaUrl(s.LogoPath);this.ownerPreview=this.mediaUrl(s.OwnerPhoto);this.loading=false;},error:e=>{this.error=e.message;this.loading=false;}}); }
  async choose(event:Event,kind:'logo'|'owner'):Promise<void> {
    const file=(event.target as HTMLInputElement).files?.[0]; this.error=''; if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){this.error='Select a JPG, PNG or WebP image.';return;}
    if(file.size>5*1024*1024){this.error='The image must be smaller than 5 MB.';return;}
    try { const data=await optimizedImageData(file);if(kind==='logo'){this.logoData=data;this.logoName=file.name;this.logoPreview=data;}else{this.ownerData=data;this.ownerName=file.name;this.ownerPreview=data;} }
    catch(error){this.error=(error as Error).message;}
  }
  save():void { if(!this.site?.SiteName.trim()){this.error='Website name is required.';return;} this.busy=true;this.error='';this.api.updateSite({...this.site,logoData:this.logoData,logoName:this.logoName,ownerData:this.ownerData,ownerImageName:this.ownerName} as any).subscribe({next:r=>{this.message=r.message||'Website details saved.';this.busy=false;},error:e=>{this.error=e.message;this.busy=false;}}); }
  mediaUrl(path:string):string { return serviceImage(path); }
  logout():void{this.auth.logout();this.router.navigateByUrl('/home');}
}
