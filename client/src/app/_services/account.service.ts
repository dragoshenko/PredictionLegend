import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, BehaviorSubject } from 'rxjs';
import { User } from '../_models/user';
import { CookieService } from 'ngx-cookie-service';
import { RegisterResponse } from '../_models/registerResponse';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private currentUserSource = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSource.asObservable();

  private sessionKeyExists = new BehaviorSubject<boolean>(false);
  sessionKeyExists$ = this.sessionKeyExists.asObservable();

  private emailVerificationRequired = new BehaviorSubject<boolean>(false);
  emailVerificationRequired$ = this.emailVerificationRequired.asObservable();

  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  baseUrl = environment.apiUrl;

  constructor() {
    this.checkSessionStatus();
  }

  private checkSessionStatus() {
    const userJson = this.cookieService.get('user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      this.currentUserSource.next(user);
      this.sessionKeyExists.next(true);
    } else {
      this.currentUserSource.next(null);
      this.sessionKeyExists.next(false);
    }
  }

  login(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map(user => {
        this.emailVerificationRequired.next(user.isEmailVerified === false);
        if (user.isEmailVerified) {
          this.setCurrentUser(user);
          return user;
        }
        return null;
      })
    );
  }

  register(model: any) {
    return this.http.post<RegisterResponse>(this.baseUrl + 'account/register', model).pipe(
      map(response => {
        if (response.isRegistered) {
          this.login(model);
        }
      })
    );
  }

  setCurrentUser(user: User) {
    if (user) {
      this.cookieService.set('user', JSON.stringify(user), 7);
      this.currentUserSource.next(user);
      this.sessionKeyExists.next(true);
    }
  }

  logout() {
    this.cookieService.delete('user');
    this.currentUserSource.next(null);
    this.sessionKeyExists.next(false);
  }

  getCurrentUser(): User | null {
    const userJson = this.cookieService.get('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
