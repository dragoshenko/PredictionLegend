import { Component, effect, inject, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../_models/category';
import { Prediction } from '../_models/prediction';
import { PredictionService } from '../_services/prediction.service';
import { CategoryService } from '../_services/category.service';
import { PredictionType } from '../_models/predictionType';
import { CommonModule } from '@angular/common';
import { isDate } from 'ngx-bootstrap/chronos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-prediction',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './create-prediction.component.html',
  styleUrl: './create-prediction.component.css'
})
export class CreatePredictionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private predictionService = inject(PredictionService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  allCategories: Category[] = [];
  rootCategories: Category[] = [];
  selectedCategories: number[] = [];
  isPredictionCreated = false;
  submitting = false;
  predictionForm: FormGroup = new FormGroup({});
  minDate: string = '';

  constructor() {
    effect(() => {
      this.allCategories = this.categoryService.allCategories();
      this.rootCategories = this.categoryService.rootCategories();
      console.log('All categories:', this.allCategories);
      console.log('Root categories:', this.rootCategories);
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }


  private formatDateForInput(dateString: Date | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  initializeForm() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.predictionForm = this.fb.group({
      predictionType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      privacyType: ['', Validators.required],
      categories: [[], Validators.required],
      isDraft: [false]
    }, {
      validators: this.dateRangeValidator('startDate', 'endDate')
    });

    if (this.predictionService.createdPredictionData() !== null) {
      const predictionData = this.predictionService.createdPredictionData();
      if (predictionData) {
        this.predictionForm.patchValue({
          predictionType: predictionData.predictionType,
          title: predictionData.title,
          description: predictionData.description,
          startDate: this.formatDateForInput(predictionData.startDate),
          endDate: this.formatDateForInput(predictionData.endDate),
          privacyType: predictionData.privacyType,
          categories: predictionData.categories || [],
          isDraft: predictionData.isDraft
        });
        this.predictionForm.markAllAsTouched();
      }
    }
  }

  onCategoryChange(categoryId: number, event: Event) {
    const target = event.target as HTMLInputElement;
    this.toggleCategory(categoryId, target.checked);
  }

  toggleCategory(categoryId: number, checked: boolean) {
    const categoriesControl = this.predictionForm.get('categories');
    if (!categoriesControl) return;

    const current = categoriesControl.value as number[];
    let updatedCategories = [...current];

    if (checked) {
      if (!updatedCategories.includes(categoryId)) {
        updatedCategories.push(categoryId);
      }

      const selectedCategory = this.allCategories.find(cat => cat.id === categoryId);
      if (selectedCategory?.parentCategoryId) {
        const parentId = selectedCategory.parentCategoryId;
        if (!updatedCategories.includes(parentId)) {
          updatedCategories.push(parentId);
        }
      }
    } else {
      updatedCategories = updatedCategories.filter(id => id !== categoryId);

      const parentCategory = this.rootCategories.find(cat => cat.id === categoryId);
      if (parentCategory?.subCategories?.length) {
        const subCategoryIds = parentCategory.subCategories.map(sub => sub.id);
        updatedCategories = updatedCategories.filter(id => !subCategoryIds.includes(id));
      }

      const selectedCategory = this.allCategories.find(cat => cat.id === categoryId);
      if (selectedCategory?.parentCategoryId) {
        const parentId = selectedCategory.parentCategoryId;
        const parent = this.rootCategories.find(cat => cat.id === parentId);

        const siblingSubcategories = parent?.subCategories?.map(sub => sub.id) || [];
        const hasSelectedSiblings = siblingSubcategories.some(siblingId =>
          siblingId !== categoryId && updatedCategories.includes(siblingId)
        );

        if (!hasSelectedSiblings) {
          updatedCategories = updatedCategories.filter(id => id !== parentId);
        }
      }
    }

    categoriesControl.setValue(updatedCategories);
    categoriesControl.markAsTouched();
    categoriesControl.updateValueAndValidity();
  }

  dateRangeValidator(startDate: string, endDate: string) {
    return (formGroup: FormGroup) => {
      const start = formGroup.controls[startDate].value;
      const end = formGroup.controls[endDate].value;

      if (!start || !end) {
        return null;
      }

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      if (isNaN(startDateObj.getTime())) {
        formGroup.controls[startDate].setErrors({ invalidDate: true });
        return { invalidDate: true };
      }
      if (isNaN(endDateObj.getTime())) {
        formGroup.controls[endDate].setErrors({ invalidDate: true });
        return { invalidDate: true };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDateObj < today) {
        formGroup.controls[startDate].setErrors({ pastDate: true });
        return { pastDate: true };
      }
      if (endDateObj < today) {
        formGroup.controls[endDate].setErrors({ pastDate: true });
        return { pastDate: true };
      }

      const minEndDate = new Date(startDateObj);
      minEndDate.setDate(minEndDate.getDate() + 1);
      if (endDateObj < minEndDate) {
        formGroup.controls[endDate].setErrors({ invalidDateRange: true });
        return { invalidDateRange: true };
      }

      return null;
    };
  }

  onSubmit() {
    this.submitting = true;

    if (this.predictionForm.invalid) {
      this.predictionForm.markAllAsTouched();
      this.submitting = false;
      return;
    }

    const predictionData: Prediction = this.predictionForm.value;
    console.log('Form data being submitted:', predictionData);

    if (this.predictionService.createdPredictionData() !== null) {
      const currentPredictionData: Prediction | null = this.predictionService.createdPredictionData();
      if (currentPredictionData) {
        // Compare current stored data with new form data
        if (JSON.stringify(currentPredictionData) === JSON.stringify(predictionData)) {
          console.log('No changes detected, not submitting.');
          this.submitting = false;
          return;
        }

        const updatedPredictionData = { ...predictionData, id: currentPredictionData.id };

        this.predictionService.updatePrediction(updatedPredictionData).subscribe({
          next: (response) => {
            console.log('Prediction updated successfully:', response);
            this.isPredictionCreated = true;
            this.predictionService.createdPredictionData.set(response);
            this.submitting = false;
            this.router.navigate(['/edit-template', response.id, response.predictionType]);
          },
          error: (error) => {
            console.error('Error updating prediction:', error);
            this.submitting = false;
          }
        });
        return;
      }
    }

    this.predictionService.createPrediction(predictionData).subscribe({
      next: (response) => {
        console.log('Prediction created successfully:', response);
        this.isPredictionCreated = true;
        this.predictionService.createdPredictionData.set(response);
        this.submitting = false;
        this.router.navigate(['/edit-template', response.id, response.predictionType]);
      },
      error: (error) => {
        console.error('Error creating prediction:', error);
        this.submitting = false;
      }
    });
  }
}
