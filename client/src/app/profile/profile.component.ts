import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../_services/account.service';
import { UserService } from '../_services/user.service';
import { User } from '../_models/user';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { ToastrService } from 'ngx-toastr';
import { createPasswordStrengthValidator } from '../_helpers/password-validator';
import { CensorEmailPipe } from "../_pipes/censor-email.pipe";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent, CensorEmailPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private accountService = inject(AccountService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private http = inject(HttpClient);
  private router = inject(Router);

  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  addPasswordForm!: FormGroup; // New form for Google-authenticated users
  verificationForm!: FormGroup;
  editMode = false;
  passwordEditMode = false;
  verificationMode = false;
  loading = false;
  userStats: { created: number, completed: number, answered: number } | null = null;
  isGoogleAuthenticatedWithoutPassword = false; // New flag

  ngOnInit(): void {
    // Initialize the form first
    this.initializeForm();
    this.initializePasswordForm();
    this.initializeAddPasswordForm();
    this.initializeVerificationForm();

    // Then load user data
    this.loadUser();
    this.loadUserStats();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      username: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}],
      bio: ['']
    });
  }

  initializePasswordForm() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: this.passwordMatchValidator('newPassword', 'confirmPassword')
    });
  }

  initializeVerificationForm() {
    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  loadUser() {
    this.accountService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
          username: user.username,
          email: user.email
        });

        // Check if user is Google-authenticated without a password
        this.isGoogleAuthenticatedWithoutPassword = !user.hasChangedGenericPassword;
        console.log('User has changed generic password:', user.hasChangedGenericPassword);
        console.log('Is Google authenticated without password:', this.isGoogleAuthenticatedWithoutPassword);
      }
    });
  }

  passwordMatchValidator(password: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passwordControl = formGroup.controls[password];
      const confirmPasswordControl = formGroup.controls[confirmPassword];

      if (!passwordControl.value || !confirmPasswordControl.value) {
        return null;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPasswordControl.setErrors(null);
        return null;
      }
    };
  }

  loadUserStats() {
    this.userService.getUserStats().subscribe({
      next: stats => {
        this.userStats = stats;
      },
      error: error => {
        console.error('Failed to load user stats', error);
        this.userStats = {
          created: 0,
          completed: 0,
          answered: 0
        };
      }
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.loadUser();
    }
  }

  togglePasswordEditMode() {
    this.passwordEditMode = !this.passwordEditMode;
    if (!this.passwordEditMode) {
      this.passwordForm.reset();
      this.addPasswordForm.reset();
      this.verificationMode = false;
    }
  }

  saveChanges() {
    if (this.profileForm.valid) {
      this.loading = true;

      const updateModel = {
        DisplayName: this.profileForm.get('displayName')?.value,
        Bio: this.profileForm.get('bio')?.value || ''
      };

      // Direct API call to update profile
      this.http.put(environment.apiUrl + 'user', updateModel).subscribe({
        next: (response) => {
          console.log('Profile update response:', response);
          this.toastr.success('Profile updated successfully');
          this.refreshUserData();
          this.loading = false;
          this.editMode = false;
        },
        error: error => {
          console.error('Update profile error:', error);
          this.toastr.error(error.error || 'Failed to update profile');
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
      this.toastr.error('Please fix the validation errors');
    }
  }

  savePassword() {
    if (this.isGoogleAuthenticatedWithoutPassword) {
      // Google user adding a password
      this.addPassword();
    } else {
      // Regular user changing password
      if (this.passwordForm.valid) {
        this.loading = true;

      const loginCredentials = {
        usernameOrEmail: this.user?.username || '',
        password: this.passwordForm.get('currentPassword')?.value
      };

      console.log('Verifying current password by login attempt');

      this.accountService.login(loginCredentials).subscribe({
        next: () => {
          // Password is correct, request verification code
          this.requestVerificationCode();
        },
        error: error => {
          console.error('Password verification error:', error);
          this.toastr.error('Current password is incorrect');
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
      this.toastr.error('Please fix the validation errors');
    }
  }
  }

  requestVerificationCode() {
    // Store password change data for after verification
    const passwordChangeData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    sessionStorage.setItem('pendingPasswordChange', JSON.stringify(passwordChangeData));

    // Request verification code
    this.userService.requestPasswordChangeVerification({
      email: this.user?.email
    }).subscribe({
      next: response => {
        console.log('Verification code requested:', response);
        this.toastr.info('Please check your email for a verification code');
        this.verificationMode = true;
        this.loading = false;
      },
      error: error => {
        console.error('Failed to request verification code:', error);
        // More detailed error message
        if (error.status === 0) {
          this.toastr.error('Network error - could not connect to server');
        } else if (error.status === 404) {

        } else {
          this.toastr.error(error.error?.message || 'Could not send verification email');
        }
        this.loading = false;

        // Fallback to direct password change if verification fails
        this.directPasswordChange();
      }
    });
  }
/*
  verifyAndChangePassword() {
    if (this.verificationForm.valid) {
      this.loading = true;

      const verificationCode = this.verificationForm.get('verificationCode')?.value;
      const pendingPasswordChangeStr = sessionStorage.getItem('pendingPasswordChange');

      if (!pendingPasswordChangeStr) {
        this.toastr.error('No pending password change found');
        this.loading = false;
        return;
      }

      const pendingPasswordChange = JSON.parse(pendingPasswordChangeStr);

      // Verify the code and change password
      this.http.post(environment.apiUrl + 'password/verify-and-change', {
        username: this.user?.username,
        verificationCode: verificationCode,
        currentPassword: pendingPasswordChange.currentPassword,
        newPassword: pendingPasswordChange.newPassword
      }).subscribe({
        next: response => {
          console.log('Password change successful:', response);
          this.toastr.success('Password changed successfully');
          this.loading = false;
          this.passwordEditMode = false;
          this.verificationMode = false;
          this.passwordForm.reset();
          this.verificationForm.reset();

          // Clean up session storage
          sessionStorage.removeItem('pendingPasswordChange');

          // Re-login to refresh the authentication
          this.reloginAfterPasswordChange(pendingPasswordChange.newPassword);
        },
        error: error => {
          console.error('Verification error:', error);
          this.toastr.error(error.error?.message || error.error || 'Invalid verification code');
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.verificationForm);
      this.toastr.error('Please enter a valid verification code');
    }
  }
*/
  // Fallback methods in case verification is not available
  directPasswordChange() {
    const changeData = {
      Username: this.user?.username,
      CurrentPassword: this.passwordForm.get('currentPassword')?.value,
      NewPassword: this.passwordForm.get('newPassword')?.value
    };

    console.log('Sending direct password change request as fallback:', changeData);

    this.http.post(environment.apiUrl + 'password/direct-change', changeData).subscribe({
      next: (response) => {
        console.log('Password change successful:', response);
        this.toastr.success('Password changed successfully');
        this.loading = false;
        this.passwordEditMode = false;
        this.passwordForm.reset();
        // Re-login to refresh the authentication
        this.reloginAfterPasswordChange(this.passwordForm.get('newPassword')?.value);
      },
      error: error => {
        console.error('Direct password change error:', error);
        this.toastr.error(error.error?.message || error.error || 'Failed to change password');
        this.loading = false;
        this.tryTokenBasedPasswordChange();
      }
    });
  }

  tryTokenBasedPasswordChange() {
    this.userService.requestPasswordChange({
      CurrentPassword: this.passwordForm.get('currentPassword')?.value
    }).subscribe({
      next: () => {
        this.http.post(environment.apiUrl + 'user/reset-password', {
          UserId: this.user?.username,
          Token: 'placeholder_token',
          NewPassword: this.passwordForm.get('newPassword')?.value
        }).subscribe({
          next: () => {
            this.toastr.success('Password changed via token method');
            this.loading = false;
            this.passwordEditMode = false;
            this.passwordForm.reset();
            this.reloginAfterPasswordChange(this.passwordForm.get('newPassword')?.value);
          },
          error: finalError => {
            console.error('All password change approaches failed:', finalError);
            this.toastr.error('Could not update password - please log out and use the "Forgot Password" option');
            this.loading = false;
          }
        });
      },
      error: error => {
        console.error('Failed to get password token:', error);
        this.toastr.error('All password change attempts failed');
        this.loading = false;
      }
    });
  }

  reloginAfterPasswordChange(newPassword: string) {
    // Re-login with new password to update tokens
    const loginCredentials = {
      usernameOrEmail: this.user?.username || '',
      password: newPassword
    };

    this.accountService.login(loginCredentials).subscribe({
      next: () => {
        this.toastr.success('Re-authenticated with new password');
      },
      error: error => {
        console.error('Re-login error:', error);
        this.toastr.warning('Password changed but you may need to log out and back in');
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  refreshUserData() {
    this.accountService.refreshUserData().subscribe({
      next: user => {
        if (user) {
          console.log('Refreshed user data:', user);
          this.user = user;

          // Update the flag based on fresh data
          this.isGoogleAuthenticatedWithoutPassword = !user.hasChangedGenericPassword;

          this.profileForm.patchValue({
            displayName: user.displayName,
            username: user.username,
            email: user.email
          });

          // Force nav component reload by updating the source
          this.accountService.setCurrentUser(user, true);
          this.loadUserStats();
        }
      },
      error: error => {
        console.error('Failed to refresh user data:', error);
        this.toastr.error('Could not refresh user data');
      }
    });
  }

  cancelVerification() {
    this.verificationMode = false;
    this.verificationForm.reset();
    sessionStorage.removeItem('pendingPasswordChange');
  }

  initializeAddPasswordForm() {
    this.addPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: this.passwordMatchValidator('newPassword', 'confirmPassword')
    });
  }

  addPassword() {
    if (this.addPasswordForm.valid) {
      this.loading = true;
      this.directAddPassword();
    } else {
      this.markFormGroupTouched(this.addPasswordForm);
    }
  }

  directAddPassword() {
    const addData = {
      Username: this.user?.username,
      NewPassword: this.addPasswordForm.get('newPassword')?.value
    };

    console.log('Sending direct password add request:', addData);

    this.http.post(environment.apiUrl + 'password/direct-add', addData).subscribe({
      next: (response) => {
        console.log('Password add successful:', response);
        this.toastr.success('Password added successfully');
        this.loading = false;
        this.passwordEditMode = false;
        this.addPasswordForm.reset();

        if (this.user) {
          this.user.hasChangedGenericPassword = true;
          this.accountService.setCurrentUser(this.user, true);
        }

        this.refreshUserData();
      },
      error: error => {
        console.error('Direct password add error:', error);
        this.toastr.error(error.error?.message || error.error || 'Failed to add password');
        this.loading = false;
      }
    });
  }

}
