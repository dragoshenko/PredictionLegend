import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { CategoryService } from '../_services/category.service';
import { ToastrService } from 'ngx-toastr';
import { Category, CreateBracketRequest, CreatePredictionRequest } from '../_models/prediction';
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

  // Categories
  rootCategories: Category[] = [];
  selectedCategoryIds: number[] = [];

  // ViewChild references to access the creator components
  @ViewChild(SimpleBracketCreatorComponent) bracketCreator!: SimpleBracketCreatorComponent;
  @ViewChild(SimpleRankingCreatorComponent) rankingCreator!: SimpleRankingCreatorComponent;
  @ViewChild(SimpleBingoCreatorComponent) bingoCreator!: SimpleBingoCreatorComponent;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private predictionService: PredictionService,
    private categoryService: CategoryService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
  }

  initializeForm(): void {
    this.predictionForm = this.fb.group({
      predictionType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', []],
      privacyType: ['public', Validators.required],
      rows: [3, [Validators.required, Validators.min(2), Validators.max(100)]],
      columns: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      isPublished: [true] // default to publish immediately
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

  loadCategories(): void {
    this.categoryService.getCategoryTree().subscribe({
      next: (categories) => {
        this.rootCategories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Failed to load categories');
      }
    });
  }

  toggleCategory(categoryId: number, event: any): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      if (!this.selectedCategoryIds.includes(categoryId)) {
        this.selectedCategoryIds.push(categoryId);
      }
    } else {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    }
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
      const predictionType = this.predictionForm.get('predictionType')?.value;

      // Common data for all prediction types
      const commonData = {
        title: this.predictionForm.get('title')?.value,
        description: this.predictionForm.get('description')?.value,
        privacyType: this.predictionForm.get('privacyType')?.value,
        rows: this.predictionForm.get('rows')?.value,
        columns: this.predictionForm.get('columns')?.value,
        isPublished: this.predictionForm.get('isPublished')?.value,
        categoryIds: this.selectedCategoryIds,
      };

      // For bracket, ranking, or bingo type, move to configuration
      this.isPredictionCreated = true;
      this.createdPredictionData = {
        ...commonData,
        predictionType
      };
      this.submitting = false;
      this.toastr.success(`${predictionType.charAt(0).toUpperCase() + predictionType.slice(1)} prediction created! Now configure your ${predictionType}`);
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
    const bracketData = this.bracketCreator.getBracketData();
    const finalChampion = this.bracketCreator.getFinalChampion();

    // Check if we have a valid champion selected
    if (!finalChampion) {
      this.toastr.warning('Please complete the bracket by selecting a final champion');
      return;
    }

    // Prepare the DTO for creating a bracket prediction
    const createBracketDto: CreateBracketRequest = {
      title: this.createdPredictionData.title,
      description: this.createdPredictionData.description,
      privacyType: this.createdPredictionData.privacyType,
      rounds: this.createdPredictionData.rows,
      isPublished: this.createdPredictionData.isPublished,
      categoryIds: this.selectedCategoryIds,
      matches: bracketData.matches
    };

    // Send to API
    this.predictionService.createBracketPrediction(createBracketDto).subscribe({
      next: (response) => {
        this.toastr.success('Bracket prediction saved successfully!');
        this.router.navigate(['/my-predictions']);
      },
      error: (error) => {
        console.error('Error saving bracket prediction:', error);
        this.toastr.error('Failed to save bracket prediction');
      }
    });
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

    rankingData.ranks.forEach((rank: any) => {
      rank.items.forEach((item: any) => {
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

    // Prepare the DTO for creating a ranking prediction
    const createRankingDto: CreatePredictionRequest = {
      title: this.createdPredictionData.title,
      description: this.createdPredictionData.description,
      predictionType: 'ranking',
      privacyType: this.createdPredictionData.privacyType,
      rows: this.createdPredictionData.rows,
      columns: this.createdPredictionData.columns,
      isPublished: this.createdPredictionData.isPublished,
      categoryIds: this.selectedCategoryIds
    };

    // In a real app, you would include ranking data in your DTO
    // This depends on your backend API design
    const rankingDataWithMeta = {
      ...createRankingDto,
      rankingData: rankingData
    };

    // Send to API
    this.predictionService.createPrediction(createRankingDto).subscribe({
      next: (response) => {
        this.toastr.success('Ranking prediction saved successfully!');
        this.router.navigate(['/my-predictions']);
      },
      error: (error) => {
        console.error('Error saving ranking prediction:', error);
        this.toastr.error('Failed to save ranking prediction');
      }
    });
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

    // Prepare the DTO for creating a bingo prediction
    const createBingoDto: CreatePredictionRequest = {
      title: this.createdPredictionData.title,
      description: this.createdPredictionData.description,
      predictionType: 'bingo',
      privacyType: this.createdPredictionData.privacyType,
      rows: this.createdPredictionData.rows,
      columns: this.createdPredictionData.rows, // Same as rows for bingo
      isPublished: this.createdPredictionData.isPublished,
      categoryIds: this.selectedCategoryIds
    };

    // In a real app, you would include bingo data in your DTO
    // This depends on your backend API design
    const bingoDataWithMeta = {
      ...createBingoDto,
      bingoData: bingoData
    };

    // Send to API
    this.predictionService.createPrediction(createBingoDto).subscribe({
      next: (response) => {
        this.toastr.success('Bingo board saved successfully!');
        this.router.navigate(['/my-predictions']);
      },
      error: (error) => {
        console.error('Error saving bingo board:', error);
        this.toastr.error('Failed to save bingo board');
      }
    });
  }
}
