import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { CounterPredictionComponent } from '../counter-prediction/counter-prediction.component';

interface PostDetail {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  author: any;
  categories: any[];
  notes?: string;
  isActive: boolean;
  canCounterPredict: boolean;
  hasUserCounterPredicted: boolean;
  originalPostRank?: any;
  originalPostBracket?: any;
  originalPostBingo?: any;
  counterPredictions: CounterPrediction[];
  counterPredictionsCount: number;
}

interface CounterPrediction {
  id: number;
  author: any;
  createdAt: Date;
  notes?: string;
  totalScore: number;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
}

@Component({
  selector: 'app-prediction-details',
  imports: [CommonModule, CounterPredictionComponent],
  template: `
    <div class="container-fluid mt-4" *ngIf="postDetail">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">{{ postDetail.title }}</h2>
              <p class="text-light mb-0 opacity-75">{{ postDetail.description }}</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>
              <button
                *ngIf="postDetail.canCounterPredict"
                class="btn btn-success"
                (click)="showCounterPrediction = true">
                <i class="fa fa-plus me-2"></i>Counter Predict
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Prediction Info -->
      <div class="row mb-4">
        <div class="col-md-8">
          <div class="card bg-secondary border-secondary">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa"
                   [ngClass]="{
                     'fa-list-ol': postDetail.predictionType === 'Ranking',
                     'fa-sitemap': postDetail.predictionType === 'Bracket',
                     'fa-th': postDetail.predictionType === 'Bingo'
                   }" class="me-2"></i>
                Original {{ postDetail.predictionType }} Prediction
              </h4>
            </div>
            <div class="card-body">
              <!-- Ranking Display -->
              <div *ngIf="postDetail.predictionType === 'Ranking' && postDetail.originalPostRank">
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <thead>
                      <tr>
                        <th width="80">Rank</th>
                        <th *ngFor="let col of postDetail.originalPostRank.rankTable.rows[0]?.columns || []; let i = index">
                          Position {{ i + 1 }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of postDetail.originalPostRank.rankTable.rows || []; let rowIndex = index">
                        <td class="fw-bold">#{{ row.order }}</td>
                        <td *ngFor="let column of row.columns || []">
                          <div *ngIf="column.team" class="d-flex align-items-center">
                            <img *ngIf="column.team.photoUrl" [src]="column.team.photoUrl"
                                 class="rounded me-2" width="32" height="32" alt="Team">
                            <div>
                              <div class="fw-bold text-light">{{ column.team.name }}</div>
                              <div class="small text-muted">{{ column.team.description || 'No description' }}</div>
                            </div>
                          </div>
                          <div *ngIf="!column.team" class="text-muted">Empty</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Add Bracket and Bingo displays here -->
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <!-- Prediction Stats -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Prediction Info</h5>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <img *ngIf="postDetail.author.photoUrl" [src]="postDetail.author.photoUrl"
                     class="rounded-circle me-3" width="48" height="48" alt="Author">
                <div>
                  <div class="fw-bold text-light">{{ postDetail.author.displayName }}</div>
                  <div class="small text-muted">Author</div>
                </div>
              </div>

              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Created:</strong> {{ postDetail.createdAt | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light" *ngIf="postDetail.endDate">
                  <strong>Ends:</strong> {{ postDetail.endDate | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Status:</strong>
                  <span [class]="postDetail.isActive ? 'text-success' : 'text-warning'">
                    {{ postDetail.isActive ? 'Active' : 'Ended' }}
                  </span>
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Counter Predictions:</strong> {{ postDetail.counterPredictionsCount }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Categories -->
          <div class="card bg-dark border-dark" *ngIf="postDetail.categories.length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Categories</h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                <span *ngFor="let category of postDetail.categories"
                      class="badge bg-primary">
                  {{ category.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Counter Predictions -->
      <div class="card bg-secondary border-secondary mb-4" *ngIf="postDetail.counterPredictions.length > 0">
        <div class="card-header bg-secondary border-secondary">
          <h4 class="text-light mb-0">
            <i class="fa fa-users me-2"></i>
            Counter Predictions ({{ postDetail.counterPredictions.length }})
          </h4>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-lg-6 mb-4" *ngFor="let counterPred of postDetail.counterPredictions">
              <div class="card bg-dark border-dark h-100">
                <div class="card-header bg-dark border-dark">
                  <div class="d-flex align-items-center">
                    <img *ngIf="counterPred.author.photoUrl" [src]="counterPred.author.photoUrl"
                         class="rounded-circle me-2" width="32" height="32" alt="Author">
                    <div>
                      <div class="fw-bold text-light">{{ counterPred.author.displayName }}</div>
                      <div class="small text-muted">{{ counterPred.createdAt | date:'short' }}</div>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <!-- Display counter prediction data based on type -->
                  <div *ngIf="postDetail.predictionType === 'Ranking' && counterPred.postRank">
                    <div class="table-responsive">
                      <table class="table table-sm table-dark">
                        <tbody>
                          <tr *ngFor="let row of counterPred.postRank.rankTable.rows.slice(0, 5)">
                            <td class="fw-bold">#{{ row.order }}</td>
                            <td *ngFor="let col of row.columns">
                              <div *ngIf="col.team" class="small">{{ col.team.name }}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div *ngIf="counterPred.postRank.rankTable.rows.length > 5" class="small text-muted">
                      ...and {{ counterPred.postRank.rankTable.rows.length - 5 }} more
                    </div>
                  </div>

                  <div *ngIf="counterPred.notes" class="mt-2">
                    <div class="small text-muted">Notes:</div>
                    <div class="small text-light">{{ counterPred.notes }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Counter Prediction Form -->
      <app-counter-prediction
        *ngIf="showCounterPrediction"
        [originalPrediction]="postDetail"
        [template]="template"
        [availableTeams]="availableTeams"
        (onCancel)="showCounterPrediction = false"
        (onSubmit)="onCounterPredictionSubmitted()">
      </app-counter-prediction>

      <!-- No Counter Predictions Message -->
      <div *ngIf="postDetail.counterPredictions.length === 0" class="text-center py-5">
        <i class="fa fa-users fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">No Counter Predictions Yet</h5>
        <p class="text-muted">Be the first to create a counter prediction!</p>
        <button
          *ngIf="postDetail.canCounterPredict"
          class="btn btn-primary"
          (click)="showCounterPrediction = true">
          <i class="fa fa-plus me-2"></i>Create Counter Prediction
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!postDetail && isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading prediction details...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!postDetail && !isLoading" class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-warning">Prediction Not Found</h5>
      <p class="text-muted">The prediction you're looking for doesn't exist or has been removed.</p>
      <button class="btn btn-primary" (click)="goBack()">Go Back</button>
    </div>
  `,
  styles: [`
    .table-dark th,
    .table-dark td {
      border-color: #495057;
    }

    .card {
      border-radius: 8px;
    }

    .badge {
      font-size: 0.875rem;
    }
  `]
})
export class PredictionDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  postDetail: PostDetail | null = null;
  isLoading = false;
  showCounterPrediction = false;
  template: any = null;
  availableTeams: any[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.loadPredictionDetails(predictionId);
      }
    });
  }

  async loadPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.http.get<PostDetail>(
        `${environment.apiUrl}post/${predictionId}/details`
      ).toPromise();

      if (response) {
        this.postDetail = response;
        console.log('Prediction details loaded:', this.postDetail);
      }
    } catch (error) {
      console.error('Error loading prediction details:', error);
      this.toastr.error('Failed to load prediction details');
    } finally {
      this.isLoading = false;
    }
  }

  onCounterPredictionSubmitted(): void {
    this.showCounterPrediction = false;
    this.toastr.success('Counter prediction submitted successfully!');

    // Reload the prediction details to show the new counter prediction
    if (this.postDetail) {
      this.loadPredictionDetails(this.postDetail.id);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
