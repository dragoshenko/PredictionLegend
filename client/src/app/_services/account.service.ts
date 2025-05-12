import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map, Observable, of, catchError, throwError, tap } from 'rxjs';
import { User } from '../_models/user';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EmailVerificationDTO, ResendVerificationCodeDTO } from '../_models/emailVerification';
import { ResetPasswordRequest } from '../_models/password-reset';

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

  verifyEmailCode(verificationData: EmailVerificationDTO) {
    return this.http.post(this.baseUrl + 'account/verify-email', verificationData).pipe(
      map(() => {
        return true;
      }),
      catchError(error => {
        if (error.status === 400) {
          this.toastr.error(error.error);
        } else {
          this.toastr.error('Email verification failed');
        }
        return throwError(() => 'Email verification failed. Please try again.');
      })
    );
  }

  resendVerificationCode(userId: number) {
    const resendData = { userId: userId };

    // First, let's add better error handling
    return this.http.post(this.baseUrl + 'account/resend-verification-code', resendData).pipe(
      map(() => {
        // Just return true on success, we don't need to process the response body
        return true;
      }),
      catchError(error => {
        console.error('Resend error:', error);
        // Rethrow to be handled by the component
        return throwError(() => error);
      })
    );
  }

  register(model: any) {
    console.log('Sending registration request to:', this.baseUrl + 'account/register');
    console.log('Registration data:', model);

    return this.http.post<any>(this.baseUrl + 'account/register', model).pipe(
      map(response => {
        console.log('Raw registration response:', response);

        if (response.isRegistered) {
          this.toastr.success('Registration successful');
        }

        if (response.requiresEmailConfirmation) {
          console.log('Email confirmation required, userId:', response.userId);
        }

        return response;
      }),
      catchError(error => {
        console.error('Registration error in service:', error);

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

  login(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map(user => {
        if (user) {
          this.setCurrentUser(user, model.rememberMe);
          this.toastr.success('Logged in successfully');
          return user;
        }
        return null;
      }),
      catchError(error => {
        console.log(error); // Log the full error to see its structure

        // Check if the error response contains the unverified email message
        if (error.status === 401 && error.error && typeof error.error === 'object' && error.error.userId) {
          // Store the userId for verification
          sessionStorage.setItem('verificationUserId', error.error.userId.toString());

          // Show info message
          this.toastr.info('Please verify your email to continue');

          // Return special error to trigger verification
          return throwError(() => ({ requiresVerification: true }));
        }
        else if (error.status === 400 || error.status === 401) {
          // Regular auth error
          this.toastr.error(typeof error.error === 'string' ? error.error : 'Invalid credentials');
          return throwError(() => error.error);
        }

        // Generic error
        this.toastr.error('An unexpected error occurred');
        return throwError(() => 'An unexpected error occurred');
      })
    );
  }

  googleLogin(idToken: string) {
    return this.http.post<User>(this.baseUrl + 'account/google-auth', { idToken }).pipe(
      map(user => {
        if (user) {
          this.setCurrentUser(user, true);
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

  setCurrentUser(user: User, rememberMe: boolean = false) {
    if (user) {
      const expiryDays = rememberMe ? 30 : 1; // 30 days if remember me is checked, 1 day otherwise

      this.cookieService.set('user', JSON.stringify(user), expiryDays);
      this.currentUserSource.next(user);
    }
  }
  refreshUserData() {
    return this.http.get<User>(this.baseUrl + 'user').pipe(
      map(user => {
        if (user) {
          this.setCurrentUser(user, true);
          return user;
        }
        return null;
      }),
      catchError(error => {
        this.toastr.error('Failed to refresh user data');
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post(this.baseUrl + 'account/forgot-password', { email }).pipe(
      map(() => {
        this.toastr.info('If your email is registered, you will receive a password reset code');
        return true;
      }),
      catchError(error => {
        console.error('Forgot password error:', error);
        this.toastr.error('Failed to process forgot password request');
        return throwError(() => 'Failed to process forgot password request');
      })
    );
  }

  resetPassword(resetData: ResetPasswordRequest) {
    return this.http.post(this.baseUrl + 'account/reset-password', resetData).pipe(
      map(() => {
        this.toastr.success('Your password has been reset successfully');
        return true;
      }),
      catchError(error => {
        console.error('Reset password error:', error);
        this.toastr.error(error.error || 'Failed to reset password');
        return throwError(() => error.error || 'Failed to reset password');
      })
    );
  }

  logout() {
    this.cookieService.delete('user');
    this.currentUserSource.next(null);
    this.router.navigateByUrl('/');
    this.toastr.success('Logged out successfully');
  }

}
