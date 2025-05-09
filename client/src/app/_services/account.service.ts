import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map, Observable, of, catchError, throwError, tap } from 'rxjs';
import { User } from '../_models/user';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private currentUserSource = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSource.asObservable();

  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  baseUrl = environment.apiUrl;

  constructor() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const userJson = this.cookieService.get('user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      this.currentUserSource.next(user);
      return of(user);
    }
    return of(null);
  }

  login(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map(user => {
        if (user) {
          this.setCurrentUser(user);
          this.toastr.success('Logged in successfully');
          return user;
        }
        return null;
      }),
      catchError(error => {
        if (error.status === 400 || error.status === 401) {
          const errorMessage = error.error;
          this.toastr.error(errorMessage);
          return throwError(() => errorMessage);
        }
        this.toastr.error('An unexpected error occurred');
        return throwError(() => 'An unexpected error occurred. Please try again later.');
      })
    );
  }

  register(model: any) {
    return this.http.post<any>(this.baseUrl + 'account/register', model).pipe(
      map(response => {
        if (response.isRegistered) {
          this.toastr.success('Registration successful');
          return response;
        }
        if (response.requiresEmailConfirmation) {
          this.toastr.info('Please check your email to verify your account');
        }
        return response;
      }),
      catchError(error => {
        if (error.status === 400) {
          if (typeof error.error === 'string') {
            this.toastr.error(error.error);
            return throwError(() => error.error);
          }
          else if (error.error && Array.isArray(error.error)) {
            return throwError(() => error.error);
          }
        }
        // For other errors, return a generic message
        this.toastr.error('Registration failed');
        return throwError(() => 'An unexpected error occurred. Please try again later.');
      })
    );
  }

  googleLogin(idToken: string) {
    return this.http.post<User>(this.baseUrl + 'account/google-auth', { idToken }).pipe(
      map(user => {
        if (user) {
          this.setCurrentUser(user);
          this.toastr.success('Logged in with Google successfully');
          return user;
        }
        return null;
      }),
      catchError(error => {
        this.toastr.error('Google login failed');
        return throwError(() => 'Google login failed. Please try again.');
      })
    );
  }

  verifyEmail(id: number, token: string) {
    return this.http.get(this.baseUrl + `account/confirm-email?id=${id}&token=${token}`).pipe(
      map(() => {
        this.toastr.success('Email verified successfully');
        return true;
      }),
      catchError(error => {
        this.toastr.error('Email verification failed');
        return throwError(() => 'Email verification failed. Please try again.');
      })
    );
  }

  setCurrentUser(user: User) {
    if (user) {
      this.cookieService.set('user', JSON.stringify(user), 7); // 7 days expiry
      this.currentUserSource.next(user);
    }
  }

  logout() {
    this.cookieService.delete('user');
    this.currentUserSource.next(null);
    this.router.navigateByUrl('/');
    this.toastr.success('Logged out successfully');
  }
}
