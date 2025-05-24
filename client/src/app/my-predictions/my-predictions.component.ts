import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { CategoryService } from '../_services/category.service';
import { Prediction, Category } from '../_models/prediction';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-predictions.component.html',
  styleUrls: ['./my-predictions.component.css']
})
export class MyPredictionsComponent implements OnInit {
  predictions: Prediction[] = [];
  filteredPredictions: Prediction[] = [];
  categories: Category[] = [];
  loading = false;
  error: string | null = null;

  // Filter controls
  filterType = 'all';
  filterStatus = 'all';
  filterCategoryId = 0;

  constructor(
    private predictionService: PredictionService,
    private categoryService: CategoryService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPredictions();
    this.loadCategories();
  }

  loadPredictions(): void {
    this.loading = true;
    this.error = null;

    this.predictionService.getUserPredictions().subscribe({
      next: (predictions) => {
        this.predictions = predictions || [];
        this.filteredPredictions = [...this.predictions];
        this.loading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading predictions:', error);
        this.error = 'Failed to load predictions. Please try again later.';
        this.loading = false;
        this.predictions = []; // Reset to empty array on error
        this.filteredPredictions = [];
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.predictions];

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(p => p.predictionType.toLowerCase() === this.filterType.toLowerCase());
    }

    // Filter by status
    if (this.filterStatus === 'published') {
      filtered = filtered.filter(p => p.isPublished);
    } else if (this.filterStatus === 'draft') {
      filtered = filtered.filter(p => !p.isPublished);
    }

    // Filter by category
    if (this.filterCategoryId > 0) {
      filtered = filtered.filter(p =>
        p.categories && p.categories.some(c => c.id === +this.filterCategoryId)
      );
    }

    this.filteredPredictions = filtered;
  }

  clearFilters(): void {
    this.filterType = 'all';
    this.filterStatus = 'all';
    this.filterCategoryId = 0;
    this.applyFilters();
  }

  createPrediction(): void {
    this.router.navigate(['/create-prediction']);
  }

  editPrediction(id: number): void {
    // Navigate to edit page with ID
    // This would be implemented in a future feature
    console.log('Edit prediction:', id);
  }

  deletePrediction(id: number): void {
    if (confirm('Are you sure you want to delete this prediction?')) {
      // First, determine if this is a bracket prediction
      const prediction = this.predictions.find(p => p.id === id);

      if (prediction && prediction.predictionType.toLowerCase() === 'bracket') {
        // Use the bracket-specific delete endpoint
        this.predictionService.deleteBracketPrediction(id).subscribe({
          next: () => {
            this.toastr.success('Prediction deleted successfully');
            this.loadPredictions(); // Refresh the list
          },
          error: (error) => {
            console.error('Error deleting prediction:', error);
            this.toastr.error('Failed to delete prediction');
          }
        });
      } else {
        // Use the generic delete endpoint
        this.predictionService.deletePrediction(id).subscribe({
          next: () => {
            this.toastr.success('Prediction deleted successfully');
            this.loadPredictions(); // Refresh the list
          },
          error: (error) => {
            console.error('Error deleting prediction:', error);
            this.toastr.error('Failed to delete prediction');
          }
        });
      }
    }
  }

  publishPrediction(id: number): void {
    // First, determine if this is a bracket prediction
    const prediction = this.predictions.find(p => p.id === id);

    if (prediction && prediction.predictionType.toLowerCase() === 'bracket') {
      // Use the bracket-specific publish endpoint
      this.predictionService.publishBracketPrediction(id).subscribe({
        next: () => {
          this.toastr.success('Prediction published successfully');
          this.loadPredictions(); // Refresh the list
        },
        error: (error) => {
          console.error('Error publishing prediction:', error);
          this.toastr.error('Failed to publish prediction');
        }
      });
    } else {
      // Use the generic publish endpoint
      this.predictionService.publishPrediction(id).subscribe({
        next: () => {
          this.toastr.success('Prediction published successfully');
          this.loadPredictions(); // Refresh the list
        },
        error: (error) => {
          console.error('Error publishing prediction:', error);
          this.toastr.error('Failed to publish prediction');
        }
      });
    }
  }

  getPrivacyIcon(privacyType: string): string {
    switch (privacyType.toLowerCase()) {
      case 'public':
        return 'fa-globe';
      case 'private':
        return 'fa-lock';
      case 'linkonly':
        return 'fa-link';
      default:
        return 'fa-question';
    }
  }

  getPrivacyLabel(privacyType: string): string {
    switch (privacyType.toLowerCase()) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'linkonly':
        return 'Link Only';
      default:
        return 'Unknown';
    }
  }

  getPredictionTypeIcon(predictionType: string): string {
    switch (predictionType.toLowerCase()) {
      case 'ranking':
        return 'fa-list-ol';
      case 'bracket':
        return 'fa-sitemap';
      case 'bingo':
        return 'fa-th';
      default:
        return 'fa-question';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  // Calculate contrast color for readable text on colored backgrounds
  getContrastColor(hexColor: string | undefined): string {
    if (!hexColor) return 'white';

    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for bright colors, white for dark colors
    return luminance > 0.5 ? 'black' : 'white';
  }
}
