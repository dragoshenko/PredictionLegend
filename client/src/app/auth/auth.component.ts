import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TextInputComponent } from "../_forms/text-input/text-input.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, TextInputComponent, CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  @Output() cancelAuth = new EventEmitter<boolean>();

  isLoginMode = true;
  verifyMode = false;
  loginForm: FormGroup = new FormGroup({});
  registerForm: FormGroup = new FormGroup({});
  verifyForm: FormGroup = new FormGroup({});
  validationErrors: string[] | undefined;

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms() {
    // Login form
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
    });

    // Register form
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      confirmPassword: ['', [Validators.required, this.matchValues('password')]]
    });

    // Verification form
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Subscribe to password value changes to constantly check against it
    this.registerForm.controls['password'].valueChanges.subscribe({
      next: () => this.registerForm.controls['confirmPassword'].updateValueAndValidity()
    });
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      return control.value === control.parent?.get(matchTo)?.value ? null : {isMatching: true};
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.validationErrors = undefined;
  }

  login() {
    if (this.loginForm.valid) {
      // TODO: Implement your login logic here
      console.log('Login form submitted:', this.loginForm.value);

      // Simulate successful login - replace with actual API call
      this.router.navigate(['/dashboard']);
    }
  }

  register() {
    if (this.registerForm.valid) {
      // TODO: Implement your register logic here
      console.log('Register form submitted:', this.registerForm.value);

      // Simulate successful registration - replace with actual API call
      this.verifyMode = true;
    }
  }

  verifyEmail() {
    if (this.verifyForm.valid) {
      // TODO: Implement your verification logic here
      console.log('Verification form submitted:', this.verifyForm.value);

      // Simulate successful verification - replace with actual API call
      this.router.navigate(['/dashboard']);
    }
  }

  submitForm() {
    this.validationErrors = undefined;

    if (this.verifyMode) {
      this.verifyEmail();
    } else if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  cancel() {
    this.cancelAuth.emit(false);
  }
}
