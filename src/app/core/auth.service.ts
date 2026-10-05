import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

export interface LoggedInUser {
  id: number;
  name: string;
  type: 'customer' | 'admin';
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'selectcutz_user';
  private readonly userSubject = new BehaviorSubject<LoggedInUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private api: ApiService) {}

  get user(): LoggedInUser | null {
    return this.userSubject.value;
  }

  login(username: string, password: string, type: 'customer' | 'admin') {
    return this.api.login(username, password, type);
  }

  register(name: string, email: string, phone: string, password: string) {
    return this.api.register(name, email, phone, password);
  }

  setUser(user: LoggedInUser) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  logout() {
    this.api.logout().subscribe({ error: () => undefined });
    localStorage.removeItem('selectcutz_session');
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  private readUser(): LoggedInUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as LoggedInUser : null;
    } catch {
      return null;
    }
  }
}
