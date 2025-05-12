import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../_services/account.service';
import { UserService } from '../_services/user.service'; // Add this or use AccountService if you added methods there
import { User } from '../_models/user';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { ToastrService } from 'ngx-toastr';
import { createPasswordStrengthValidator } from '../_helpers/password-validator';
import { CensorEmailPipe } from "../_pipes/censor-email.pipe";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent, CensorEmailPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private accountService = inject(AccountService);
  private userService = inject(UserService); // Or use accountService if you added methods there
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  user: User | null = null;
  profileForm!: FormGroup;
  passwordVerificationForm!: FormGroup;
  editMode = false;
  loading = false;
  showPasswordVerification = false;
  passwordChangeData: any = null;
  userStats: { created: number, completed: number, answered: number } | null = null;

  ngOnInit(): void {
    this.loadUser();
    this.initializeForm();
    this.initializePasswordVerificationForm();
    this.loadUserStats();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      username: [{value: '', disabled: true}], // Username typically shouldn't be editable
      email: [{value: '', disabled: true}], // Email typically shouldn't be editable
      currentPassword: [''],
      newPassword: ['', [
        Validators.minLength(8),
        createPasswordStrengthValidator()
      ]],
      confirmPassword: ['']
    }, {
      validator: this.passwordMatchValidator('newPassword', 'confirmPassword')
    });
  }

  // And in loadUser:
  loadUser() {
    this.accountService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
          username: user.username,
          email: user.email || user.username // Fall back to username if email not available
        });
      }
    });
  }

  initializePasswordVerificationForm() {
    this.passwordVerificationForm = this.fb.group({
      verificationCode: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$')
      ]]
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
        // Initialize with zeros if API fails
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
      this.loadUser(); // Reset form when canceling edit
    }
  }

  saveChanges() {
    if (this.profileForm.valid) {
      this.loading = true;

      // Handle display name change
      const displayNameChanged = this.profileForm.get('displayName')?.value !== this.user?.displayName;

      if (displayNameChanged) {
        const updateModel = {
          displayName: this.profileForm.get('displayName')?.value
        };

        this.userService.updateProfile(updateModel).subscribe({
          next: () => {
            this.toastr.success('Profile updated successfully');
            this.refreshUserData();

            // If also changing password, handle that next
            this.handlePasswordChange();
          },
          error: error => {
            this.toastr.error(error.error || 'Failed to update profile');
            this.loading = false;
          }
        });
      } else {
        // If only changing password
        this.handlePasswordChange();
      }
    }
  }

  handlePasswordChange() {
    const passwordChanged = this.profileForm.get('currentPassword')?.value &&
                           this.profileForm.get('newPassword')?.value;

    if (passwordChanged) {
      // Store password data for verification step
      this.passwordChangeData = {
        currentPassword: this.profileForm.get('currentPassword')?.value,
        newPassword: this.profileForm.get('newPassword')?.value
      };

      // Request verification code to be sent
      this.userService.requestPasswordChange({
        currentPassword: this.passwordChangeData.currentPassword
      }).subscribe({
        next: () => {
          this.loading = false;
          this.showPasswordVerification = true;
          this.toastr.info('A verification code has been sent to your email');
        },
        error: error => {
          this.loading = false;
          this.toastr.error(error.error || 'Current password is incorrect');
        }
      });
    } else {
      // No password change, just finish the update process
      this.loading = false;
      this.editMode = false;
    }
  }

  submitVerificationCode() {
    if (this.passwordVerificationForm.valid && this.passwordChangeData) {
      this.loading = true;

      const verificationData = {
        currentPassword: this.passwordChangeData.currentPassword,
        newPassword: this.passwordChangeData.newPassword,
        verificationCode: this.passwordVerificationForm.get('verificationCode')?.value
      };

      this.userService.verifyPasswordChange(verificationData).subscribe({
        next: () => {
          this.toastr.success('Password changed successfully');
          this.loading = false;
          this.showPasswordVerification = false;
          this.editMode = false;
          this.passwordChangeData = null;
          this.passwordVerificationForm.reset();
          this.profileForm.reset();
          this.loadUser();
        },
        error: error => {
          this.loading = false;
          this.toastr.error(error.error || 'Invalid verification code');
        }
      });
    }
  }

  cancelVerification() {
    this.showPasswordVerification = false;
    this.passwordChangeData = null;
    this.passwordVerificationForm.reset();
    this.loading = false;
  }

  refreshUserData() {
    this.accountService.refreshUserData().subscribe({
      next: user => {
        if (user) {
          this.user = user;
          this.profileForm.patchValue({
            displayName: user.displayName,
            email: user.username
          });
          this.loadUserStats();
        }
      }
    });
  }
}
