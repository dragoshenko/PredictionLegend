// profile/profile.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../_services/account.service';
import { User } from '../_models/user';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextInputComponent } from '../_forms/text-input/text-input.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  user: User | null = null;
  profileForm!: FormGroup;
  editMode = false;

  ngOnInit(): void {
    this.loadUser();
    this.initializeForm();
  }

  loadUser() {
    this.accountService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
          email: user.username // Assuming username is email
        });
      }
    });
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}], // Email is not editable
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
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
      // Here you would update the user profile
      // For now, we'll just show a success message
      this.toastr.success('Profile updated successfully');
      this.editMode = false;
    }
  }
}
