import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { Prediction } from '../_models/prediction';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-predictions.component.html',
  styleUrls: ['./my-predictions.component.css']
})
export class MyPredictionsComponent implements OnInit {
  predictions: Prediction[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private predictionService: PredictionService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPredictions();
  }

  loadPredictions(): void {
    this.loading = true;
    this.error = null;

    this.predictionService.getUserPredictions().subscribe({
      next: (predictions) => {
        this.predictions = predictions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading predictions:', error);
        this.error = 'Failed to load predictions. Please try again later.';
        this.loading = false;
      }
    });
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

  publishPrediction(id: number): void {
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

  getPrivacyIcon(privacyType: string): string {
    switch (privacyType) {
      case 'public':
        return 'fa-globe';
      case 'private':
        return 'fa-lock';
      case 'linkOnly':
        return 'fa-link';
      default:
        return 'fa-question';
    }
  }

  getPrivacyLabel(privacyType: string): string {
    switch (privacyType) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'linkOnly':
        return 'Link Only';
      default:
        return 'Unknown';
    }
  }

  getPredictionTypeIcon(predictionType: string): string {
    switch (predictionType) {
      case 'ranking':
        return 'fa-list-ol';
      case 'bracket':
        return 'fa-sitemap';
      default:
        return 'fa-question';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
