import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-custom-prediction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-prediction.component.html',
  styleUrl: './custom-prediction.component.css'
})
export class CustomPredictionComponent implements OnInit {
  predictionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.predictionForm = this.fb.group({
      predictionType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.predictionForm.valid) {
      console.log('Form submitted', this.predictionForm.value);
      // TODO: Add the API call to save the prediction

      // Redirect to a success page or the home page after submission
      // this.router.navigate(['/']);
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.predictionForm.controls).forEach(key => {
        const control = this.predictionForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
