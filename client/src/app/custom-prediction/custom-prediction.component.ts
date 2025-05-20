import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { ToastrService } from 'ngx-toastr';
import { CreatePredictionRequest } from '../_models/prediction';
import { SimpleBracketCreatorComponent } from '../simple-bracket-creator/simple-bracket-creator.component';
import { SimpleRankingCreatorComponent } from '../simple-ranking-creator/simple-ranking-creator.component';
import { SimpleBingoCreatorComponent } from '../simple-bingo-creator/simple-bingo-creator.component';

@Component({
  selector: 'app-custom-prediction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SimpleBracketCreatorComponent,
    SimpleRankingCreatorComponent,
    SimpleBingoCreatorComponent
  ],
  templateUrl: './custom-prediction.component.html',
  styleUrls: ['./custom-prediction.component.css']
})
export class CustomPredictionComponent implements OnInit {
  predictionForm!: FormGroup;
  selectedFile: File | null = null;
  submitting = false;

  // State tracking
  isPredictionCreated = false;
  createdPredictionData: any = null;

  // ViewChild references to access the creator components
  @ViewChild(SimpleBracketCreatorComponent) bracketCreator!: SimpleBracketCreatorComponent;
  @ViewChild(SimpleRankingCreatorComponent) rankingCreator!: SimpleRankingCreatorComponent;
  @ViewChild(SimpleBingoCreatorComponent) bingoCreator!: SimpleBingoCreatorComponent;

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
      } else if (value === 'bingo') {
        this.predictionForm.get('rows')?.setValue(5); // Default to 5x5 bingo grid
        this.predictionForm.get('columns')?.setValue(5);
        this.predictionForm.get('columns')?.disable();
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

      // For bracket, ranking, or bingo type, move to configuration
      if (['bracket', 'ranking', 'bingo'].includes(predictionData.predictionType)) {
        this.isPredictionCreated = true;
        this.createdPredictionData = predictionData;
        this.toastr.success('Prediction created! Now configure your ' + predictionData.predictionType);
        this.submitting = false;
      } else {
        // For other prediction types, call the API service
        this.predictionService.createPrediction(predictionData).subscribe({
          next: (response) => {
            this.submitting = false;
            this.toastr.success('Prediction created successfully!');
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
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.predictionForm.controls).forEach(key => {
        const control = this.predictionForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  // Go back to the form
  backToForm(): void {
    this.isPredictionCreated = false;
    this.createdPredictionData = null;
  }

  // Save the bracket and complete the process
  saveBracket(): void {
    if (!this.bracketCreator) {
      this.toastr.error('Bracket creator component not available');
      return;
    }

    // Get the bracket data from the bracket creator component
    const bracketData = this.bracketCreator.getFinalChampion();

    // Check if we have a valid champion selected
    if (!bracketData) {
      this.toastr.warning('Please complete the bracket by selecting a final champion');
      return;
    }

    // In a real app, you would save the bracket data to your backend here
    console.log('Saving bracket with champion:', bracketData);

    // Simulate successful save
    this.toastr.success('Bracket saved successfully!');
    this.router.navigate(['/my-predictions']);
  }

  // Save the ranking and complete the process
  saveRanking(): void {
    if (!this.rankingCreator) {
      this.toastr.error('Ranking creator component not available');
      return;
    }

    // Get the formatted ranking data from the ranking creator component
    const rankingData = this.rankingCreator.getFormattedData();

    // Validate the data (e.g., check if all items have names)
    let isValid = true;
    let emptyItemsCount = 0;

    rankingData.rows.forEach((row: any) => {
      row.items.forEach((item: any) => {
        if (!item.name || item.name.trim() === '') {
          isValid = false;
          emptyItemsCount++;
        }
      });
    });

    if (!isValid) {
      this.toastr.warning(`Please fill in all ${emptyItemsCount} empty item names`);
      return;
    }

    // In a real app, you would save the ranking data to your backend here
    console.log('Saving ranking data:', rankingData);

    // Simulate successful save
    this.toastr.success('Ranking saved successfully!');
    this.router.navigate(['/my-predictions']);
  }

  // Save the bingo board and complete the process
  saveBingo(): void {
    if (!this.bingoCreator) {
      this.toastr.error('Bingo creator component not available');
      return;
    }

    // Get the formatted bingo data from the bingo creator component
    const bingoData = this.bingoCreator.getFormattedData();

    // Validate the bingo board (e.g., ensure enough cells have content)
    const nonEmptyCells = bingoData.cells.filter((cell: any) =>
      cell.content && cell.content.trim() !== '' && !cell.isCenter
    ).length;

    const totalNonCenterCells = bingoData.cells.filter((cell: any) => !cell.isCenter).length;
    const minRequiredCells = Math.floor(totalNonCenterCells * 0.6); // At least 60% of cells should have content

    if (nonEmptyCells < minRequiredCells) {
      this.toastr.warning(`Please fill in more cells. At least ${minRequiredCells} cells should have content.`);
      return;
    }

    // In a real app, you would save the bingo data to your backend here
    console.log('Saving bingo data:', bingoData);

    // Simulate successful save
    this.toastr.success('Bingo board saved successfully!');
    this.router.navigate(['/my-predictions']);
  }
}
