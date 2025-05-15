import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { ToastrService } from 'ngx-toastr';
import { CreatePredictionRequest } from '../_models/prediction';

@Component({
  selector: 'app-custom-prediction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-prediction.component.html',
  styleUrls: ['./custom-prediction.component.css']
})
export class CustomPredictionComponent implements OnInit {
  predictionForm!: FormGroup;
  selectedFile: File | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private predictionService: PredictionService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.predictionForm = this.fb.group({
      predictionType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', []],
      privacyType: ['public', Validators.required],
      rows: [3, [Validators.required, Validators.min(2), Validators.max(100)]],
      columns: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    // Subscribe to prediction type changes to update form validation
    this.predictionForm.get('predictionType')?.valueChanges.subscribe(value => {
      if (value === 'bracket') {
        this.predictionForm.get('rows')?.setValue(3); // Default to 3 rounds (8 participants)
        this.predictionForm.get('columns')?.disable();
      } else if (value === 'ranking') {
        this.predictionForm.get('columns')?.enable();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    // Reset the file input
    const fileInput = document.getElementById('coverPhoto') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSubmit(): void {
    if (this.predictionForm.valid) {
      this.submitting = true;

      // Get form values
      const predictionData: CreatePredictionRequest = {
        title: this.predictionForm.get('title')?.value,
        description: this.predictionForm.get('description')?.value,
        predictionType: this.predictionForm.get('predictionType')?.value,
        privacyType: this.predictionForm.get('privacyType')?.value,
        rows: this.predictionForm.get('rows')?.value,
        columns: this.predictionForm.get('columns')?.value
      };

      console.log('Submitting prediction:', predictionData);

      // Call the API service to create the prediction
      this.predictionService.createPrediction(predictionData).subscribe({
        next: (response) => {
          this.submitting = false;
          this.toastr.success('Prediction created successfully!');

          // Redirect to my predictions or prediction details
          this.router.navigate(['/my-predictions']);
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error creating prediction:', error);

          if (error.error && typeof error.error === 'string') {
            this.toastr.error(error.error);
          } else {
            this.toastr.error('Failed to create prediction. Please try again.');
          }
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.predictionForm.controls).forEach(key => {
        const control = this.predictionForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
