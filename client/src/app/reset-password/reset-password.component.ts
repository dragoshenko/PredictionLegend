import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { createPasswordStrengthValidator } from '../_helpers/password-validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  resetComplete = false;
  errorMessage: string | null = null;
  email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    // Get email from session storage
    this.email = sessionStorage.getItem('resetEmail');
    if (!this.email) {
      this.router.navigateByUrl('/forgot-password');
      return;
    }

    this.resetPasswordForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$')
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(32),
        createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: this.matchPasswords('newPassword', 'confirmPassword')
    });
  }

  matchPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup) => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
      } else {
        confirmPassword.setErrors(null);
      }

      return null;
    };
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.valid && this.email) {
      this.loading = true;
      this.errorMessage = null;

      const resetData = {
        email: this.email,
        code: this.resetPasswordForm.get('code')?.value,
        newPassword: this.resetPasswordForm.get('newPassword')?.value
      };

      this.accountService.resetPassword(resetData).subscribe({
        next: () => {
          this.loading = false;
          this.resetComplete = true;

          // Clear session storage
          sessionStorage.removeItem('resetEmail');

          // Redirect to login after a delay
          setTimeout(() => {
            this.router.navigateByUrl('/auth');
          }, 3000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = typeof err === 'string' ? err : 'Failed to reset password';
        }
      });
    }
  }

  resendCode(): void {
    if (this.email) {
      this.accountService.forgotPassword(this.email).subscribe();
    }
  }
}
