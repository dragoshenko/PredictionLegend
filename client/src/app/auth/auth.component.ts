import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { AccountService } from '../_services/account.service';
import { GoogleApiService } from '../_services/google-api.service';
import { ToastrService } from 'ngx-toastr';
import { createPasswordStrengthValidator } from '../_helpers/password-validator';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent, RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private googleService = inject(GoogleApiService);
  private toastr = inject(ToastrService);

  isLoginMode = true;
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  validationErrors: string[] | undefined;
  loading = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms() {
    // Login form
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });


    // Register form
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(32),
        createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.validationErrors = undefined;
  }

  login() {
    if (this.loginForm.valid) {
      this.loading = true;

      // Store credentials for automatic login after verification
      const credentials = {
        usernameOrEmail: this.loginForm.value.usernameOrEmail,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };

      this.accountService.login(credentials).subscribe({
        next: () => {
          this.router.navigateByUrl('/');
          this.loading = false;
        },
        error: error => {
          if (error && error.requiresVerification) {
            // Store credentials for after verification
            sessionStorage.setItem('pendingLoginCredentials', JSON.stringify(credentials));
            // Redirect to verification page
            this.router.navigateByUrl('/verify-email');
          } else {
            this.validationErrors = typeof error === 'string' ? [error] : ['Login failed'];
          }
          this.loading = false;
        }
      });
    }
  }

  register() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.validationErrors = undefined;

      console.log('Submitting registration form:', this.registerForm.value);

      this.accountService.register(this.registerForm.value).subscribe({
        next: response => {
          console.log('Registration response:', response);

          if (response.requiresEmailConfirmation) {
            console.log('Email confirmation required, userId:', response.userId);

            // Store user ID for verification
            if (response.userId) {
              sessionStorage.setItem('verificationUserId', response.userId.toString());
              this.toastr.info('Please verify your email. Check your inbox for a verification code.');

              // Force navigation to verification page
              setTimeout(() => {
                this.router.navigateByUrl('/verify-email');
              }, 500);
            } else {
              console.error('No userId in response:', response);
              this.toastr.error('Registration completed but verification is not available');
            }
          } else {
            this.toastr.success('Registration successful!');
            this.router.navigateByUrl('/');
          }
          this.loading = false;
        },
        error: error => {
          console.error('Registration error:', error);

          // Handle different types of errors
          if (typeof error === 'string') {
            this.validationErrors = [error];
          } else if (Array.isArray(error)) {
            this.validationErrors = error;
          } else {
            this.validationErrors = ['Registration failed. Please try again.'];
          }
          this.loading = false;
        }
      });
    }
  }

  loginWithGoogle() {
    this.googleService.configure().subscribe(idToken => {
      if (idToken) {
        this.accountService.googleLogin(idToken).subscribe({
          next: () => {
            this.router.navigateByUrl('/');
          },
          error: error => {
            this.validationErrors = error.error ? [error.error] : ['Google login failed'];
          }
        });
      }
    });
  }

  submitForm() {
    this.validationErrors = undefined;

    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }
}
