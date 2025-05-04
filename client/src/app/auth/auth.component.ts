// auth/auth.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { AccountService } from '../_services/account.service';
import { GoogleApiService } from '../_services/google-api.service';
import { ToastrService } from 'ngx-toastr';

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
  verifyMode = false;
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  verifyForm!: FormGroup;
  validationErrors: string[] | undefined;
  loading = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms() {
    // Login form
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Register form
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]]
    });

    // Verification form
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required]]
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.validationErrors = undefined;
  }

  login() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.accountService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigateByUrl('/');
          this.loading = false;
        },
        error: error => {
          this.validationErrors = error.error ? [error.error] : ['Login failed'];
          this.loading = false;
        }
      });
    }
  }

  register() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.accountService.register(this.registerForm.value).subscribe({
        next: response => {
          if (response.requiresEmailConfirmation) {
            this.verifyMode = true;
          } else {
            this.router.navigateByUrl('/');
          }
          this.loading = false;
        },
        error: error => {
          this.validationErrors = error.error ? [error.error] : ['Registration failed'];
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
