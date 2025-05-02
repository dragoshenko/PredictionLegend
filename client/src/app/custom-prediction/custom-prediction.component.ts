import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
      description: ['', [Validators.required, Validators.minLength(10)]],
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
      // Create form data for file upload
      const formData = new FormData();

      // Add form values to formData
      Object.keys(this.predictionForm.value).forEach(key => {
        formData.append(key, this.predictionForm.get(key)?.value);
      });

      // Add file if selected
      if (this.selectedFile) {
        formData.append('coverPhoto', this.selectedFile);
      }

      console.log('Form submitted', this.predictionForm.value);
      console.log('Selected file:', this.selectedFile);

      // TODO: Add the API call to save the prediction
      // this.predictionService.createPrediction(formData).subscribe(...)

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
