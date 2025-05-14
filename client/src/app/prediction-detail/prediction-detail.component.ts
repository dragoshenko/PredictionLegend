import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PredictionService } from '../_services/prediction.service';
import { Prediction } from '../_models/prediction';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-prediction-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prediction-detail.component.html',
  styleUrls: ['./prediction-detail.component.css']
})
export class PredictionDetailComponent implements OnInit {
  prediction: Prediction | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private predictionService: PredictionService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const id = parseInt(this.route.snapshot.paramMap.get('id') || '0');

    if (id <= 0) {
      this.error = 'Invalid prediction ID';
      this.loading = false;
      return;
    }

    this.loadPrediction(id);
  }

  loadPrediction(id: number): void {
    this.predictionService.getPredictionById(id).subscribe({
      next: (prediction) => {
        this.prediction = prediction;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prediction:', error);

        if (error.status === 404) {
          this.error = 'Prediction not found';
        } else if (error.status === 403) {
          this.error = 'You do not have permission to view this prediction';
        } else {
          this.error = 'Failed to load prediction. Please try again later.';
        }

        this.loading = false;
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

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }

  editPrediction(): void {
    // Navigate to edit page with ID (for future implementation)
    console.log('Edit prediction:', this.prediction?.id);
  }

  deletePrediction(): void {
    if (!this.prediction) return;

    if (confirm('Are you sure you want to delete this prediction?')) {
      this.predictionService.deletePrediction(this.prediction.id).subscribe({
        next: () => {
          this.toastr.success('Prediction deleted successfully');
          this.router.navigate(['/my-predictions']);
        },
        error: (error) => {
          console.error('Error deleting prediction:', error);
          this.toastr.error('Failed to delete prediction');
        }
      });
    }
  }

  publishPrediction(): void {
    if (!this.prediction) return;

    this.predictionService.publishPrediction(this.prediction.id).subscribe({
      next: () => {
        this.toastr.success('Prediction published successfully');
        // Reload the prediction to update the UI
        this.loadPrediction(this.prediction!.id);
      },
      error: (error) => {
        console.error('Error publishing prediction:', error);
        this.toastr.error('Failed to publish prediction');
      }
    });
  }
}
