// client/src/app/my-prediction-view/my-prediction-view.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { FormsModule } from '@angular/forms';

interface MyPredictionDetail {
  id: number;
  title: string;
  description: string;
  predictionType: string | number;
  createdAt: Date;
  endDate?: Date;
  isActive: boolean;
  isDraft: boolean;
  userId: number;
  author: any;
  categories: any[];
  postRanks?: any[];
  postBrackets?: any[];
  postBingos?: any[];
  counterPredictionsCount?: number;
  privacyType?: string;
  accessCode?: string;
}

@Component({
  selector: 'app-my-prediction-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid mt-4" *ngIf="predictionDetail">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">{{ predictionDetail.title }}</h2>
              <p class="text-light mb-0 opacity-75">{{ predictionDetail.description }}</p>
              <div class="mt-2">
                <span class="badge me-2"
                      [class.bg-success]="!predictionDetail.isDraft && predictionDetail.isActive"
                      [class.bg-warning]="predictionDetail.isDraft"
                      [class.bg-secondary]="!predictionDetail.isDraft && !predictionDetail.isActive">
                  {{ getStatusText() }}
                </span>
                <span class="badge bg-info me-2">{{ getPredictionTypeDisplayName() }}</span>
                <span class="badge bg-secondary">{{ predictionDetail.privacyType || 'Public' }}</span>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>

              <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button"
                        id="actionsDropdown" data-bs-toggle="dropdown">
                  <i class="fa fa-cog me-2"></i>Actions
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li *ngIf="predictionDetail.isDraft">
                    <button class="dropdown-item" (click)="editPrediction()">
                      <i class="fa fa-edit me-2"></i>Continue Editing
                    </button>
                  </li>
                  <li *ngIf="predictionDetail.isDraft">
                    <button class="dropdown-item" (click)="publishPrediction()">
                      <i class="fa fa-globe me-2"></i>Publish Now
                    </button>
                  </li>

                  <li *ngIf="!predictionDetail.isDraft">
                    <button class="dropdown-item" (click)="sharePost()">
                      <i class="fa fa-share me-2"></i>Share
                    </button>
                  </li>

                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <button class="dropdown-item text-danger" (click)="deletePrediction()">
                      <i class="fa fa-trash me-2"></i>Delete
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Counter Predictions Summary -->
      <div class="card bg-info border-info mb-4" *ngIf="!predictionDetail.isDraft && predictionDetail.counterPredictionsCount">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="text-light mb-1">
                <i class="fa fa-users me-2"></i>{{ predictionDetail.counterPredictionsCount }} Counter Predictions
              </h5>
              <p class="text-light mb-0 opacity-75">
                Other users have responded to your prediction
              </p>
            </div>
            <button class="btn btn-outline-light" (click)="viewCounterPredictions()">
              <i class="fa fa-eye me-2"></i>View Responses
            </button>
          </div>
        </div>
      </div>

      <!-- Draft Notice -->
      <div class="alert alert-warning" *ngIf="predictionDetail.isDraft">
        <i class="fa fa-exclamation-triangle me-2"></i>
        <strong>Draft Prediction:</strong> This prediction is not visible to other users.
        <button class="btn btn-sm btn-warning ms-2" (click)="editPrediction()">
          Continue Editing
        </button>
        <button class="btn btn-sm btn-success ms-2" (click)="publishPrediction()">
          Publish Now
        </button>
      </div>

      <!-- Access Code Display -->
      <div class="alert alert-info" *ngIf="predictionDetail.accessCode && predictionDetail.privacyType === 'Private'">
        <i class="fa fa-lock me-2"></i>
        <strong>Private Prediction Access Code:</strong>
        <code class="ms-2">{{ predictionDetail.accessCode }}</code>
        <button class="btn btn-sm btn-outline-info ms-2" (click)="copyAccessCode()">
          <i class="fa fa-copy me-1"></i>Copy Code
        </button>
      </div>

      <div class="row">
        <!-- Main Content -->
        <div class="col-lg-8">
          <!-- Original Ranking Prediction -->
          <div *ngIf="isRankingType() && hasOriginalRankingData()"
               class="card bg-secondary border-secondary mb-4">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-list-ol me-2"></i>Your Ranking Prediction
              </h4>
              <div class="small text-light opacity-75">
                Total Score: {{ getOriginalRankingData()?.totalScore || 0 }} |
                Created: {{ formatDate(getOriginalRankingData()?.createdAt) }}
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th width="80">Rank</th>
                      <th *ngFor="let col of getFirstRowColumns(); let i = index">
                        Position {{ i + 1 }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of getOriginalRankingRows(); let rowIndex = index">
                      <td class="fw-bold text-warning">#{{ row.order }}</td>
                      <td *ngFor="let column of row.columns || []">
                        <div *ngIf="column.team" class="d-flex align-items-center">
                          <img *ngIf="column.team.photoUrl && column.team.photoUrl.trim()"
                               [src]="column.team.photoUrl"
                               class="rounded me-2"
                               width="32" height="32"
                               alt="Team"
                               (error)="onImageError($event)">
                          <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                               *ngIf="!column.team.photoUrl || !column.team.photoUrl.trim()"
                               style="width: 32px; height: 32px; min-width: 32px;">
                            <i class="fa fa-users text-white small"></i>
                          </div>
                          <div>
                            <div class="fw-bold text-light">{{ column.team.name }}</div>
                            <div class="small text-muted" *ngIf="column.team.description">
                              {{ column.team.description }}
                            </div>
                          </div>
                        </div>
                        <div *ngIf="!column.team" class="text-muted small text-center py-2">
                          <i class="fa fa-minus-circle"></i> Empty Position
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Ranking Stats -->
              <div class="row mt-3">
                <div class="col-md-6">
                  <div class="card bg-dark border-dark">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-2">Structure</h6>
                      <p class="text-light mb-1 small">
                        <strong>Rows:</strong> {{ getOriginalRankingData()?.rankTable?.numberOfRows || 0 }}
                      </p>
                      <p class="text-light mb-1 small">
                        <strong>Columns:</strong> {{ getOriginalRankingData()?.rankTable?.numberOfColumns || 0 }}
                      </p>
                      <p class="text-light mb-0 small">
                        <strong>Teams Assigned:</strong> {{ getAssignedTeamsCount() }} / {{ getTotalSlotsCount() }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card bg-dark border-dark">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-2">Performance</h6>
                      <p class="text-light mb-1 small">
                        <strong>Total Score:</strong> {{ getOriginalRankingData()?.totalScore || 0 }}
                      </p>
                      <p class="text-light mb-1 small">
                        <strong>Official Result:</strong>
                        <span [class]="getOriginalRankingData()?.isOfficialResult ? 'text-success' : 'text-warning'">
                          {{ getOriginalRankingData()?.isOfficialResult ? 'Yes' : 'No' }}
                        </span>
                      </p>
                      <p class="text-light mb-0 small">
                        <strong>Last Updated:</strong> {{ formatDate(getOriginalRankingData()?.updatedAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Original Bingo Prediction -->
          <div *ngIf="isBingoType() && hasOriginalBingoData()"
               class="card bg-secondary border-secondary mb-4">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-th me-2"></i>Your Bingo Prediction
              </h4>
              <div class="small text-light opacity-75">
                Grid Size: {{ getOriginalBingoData()?.gridSize }}x{{ getOriginalBingoData()?.gridSize }} |
                Total Score: {{ getOriginalBingoData()?.totalScore || 0 }}
              </div>
            </div>
            <div class="card-body">
              <div class="bingo-grid"
                   [style.grid-template-columns]="'repeat(' + getOriginalBingoData()?.gridSize + ', 1fr)'"
                   [style.gap]="'8px'"
                   [style.display]="'grid'">

                <div *ngFor="let cell of getOriginalBingoCells(); let cellIndex = index"
                     class="bingo-cell p-2 border text-center"
                     [class.has-team]="cell.team"
                     [class.empty-cell]="!cell.team">

                  <div *ngIf="cell.team">
                    <img *ngIf="cell.team.photoUrl && cell.team.photoUrl.trim()"
                         [src]="cell.team.photoUrl"
                         class="rounded mb-1"
                         width="24" height="24"
                         alt="Team"
                         (error)="onImageError($event)">
                    <div class="bg-primary rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                         *ngIf="!cell.team.photoUrl || !cell.team.photoUrl.trim()"
                         style="width: 24px; height: 24px;">
                      <i class="fa fa-users text-white" style="font-size: 10px;"></i>
                    </div>
                    <div class="small text-light fw-bold">{{ cell.team.name }}</div>
                    <div class="very-small text-muted" *ngIf="cell.team.description">
                      {{ cell.team.description }}
                    </div>
                  </div>
                  <div *ngIf="!cell.team" class="text-muted">
                    <i class="fa fa-square-o fa-lg"></i>
                    <div class="very-small mt-1">Empty</div>
                  </div>
                </div>
              </div>

              <!-- Bingo Stats -->
              <div class="row mt-3">
                <div class="col-md-6">
                  <div class="card bg-dark border-dark">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-2">Grid Info</h6>
                      <p class="text-light mb-1 small">
                        <strong>Grid Size:</strong> {{ getOriginalBingoData()?.gridSize }}x{{ getOriginalBingoData()?.gridSize }}
                      </p>
                      <p class="text-light mb-1 small">
                        <strong>Total Cells:</strong> {{ getOriginalBingoCells()?.length || 0 }}
                      </p>
                      <p class="text-light mb-0 small">
                        <strong>Filled Cells:</strong> {{ getFilledBingoCellsCount() }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card bg-dark border-dark">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-2">Performance</h6>
                      <p class="text-light mb-1 small">
                        <strong>Total Score:</strong> {{ getOriginalBingoData()?.totalScore || 0 }}
                      </p>
                      <p class="text-light mb-1 small">
                        <strong>Completion:</strong> {{ getBingoCompletionPercentage() }}%
                      </p>
                      <p class="text-light mb-0 small">
                        <strong>Teams Used:</strong> {{ getUniqueBingoTeamsCount() }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bracket Prediction (placeholder) -->
          <div *ngIf="isBracketType()" class="card bg-secondary border-secondary mb-4">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-sitemap me-2"></i>Your Bracket Prediction
              </h4>
            </div>
            <div class="card-body text-center">
              <i class="fa fa-cogs fa-3x text-muted mb-3"></i>
              <h5 class="text-light">Bracket Display Coming Soon</h5>
              <p class="text-muted">Bracket visualization is under development.</p>
            </div>
          </div>

          <!-- No Post Data -->
          <div *ngIf="!hasOriginalPostData()" class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>No Prediction Data</h5>
              <p class="mb-3">This prediction doesn't have any ranking, bracket, or bingo data yet.</p>
              <button class="btn btn-primary" (click)="editPrediction()" *ngIf="predictionDetail.isDraft">
                <i class="fa fa-edit me-2"></i>Continue Creating
              </button>
              <div *ngIf="!predictionDetail.isDraft" class="text-muted">
                <small>This prediction was published without post data.</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Prediction Stats -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">
                <i class="fa fa-chart-bar me-2"></i>Prediction Stats
              </h5>
            </div>
            <div class="card-body">
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="card bg-info text-center">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-0">{{ predictionDetail.counterPredictionsCount || 0 }}</h6>
                      <small class="text-light">Responses</small>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="card bg-success text-center">
                    <div class="card-body py-2">
                      <h6 class="text-light mb-0">{{ getDaysActive() }}</h6>
                      <small class="text-light">Days Active</small>
                    </div>
                  </div>
                </div>
              </div>

              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Type:</strong> {{ getPredictionTypeDisplayName() }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Created:</strong> {{ formatDate(predictionDetail.createdAt) }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light" *ngIf="predictionDetail.endDate">
                  <strong>Ends:</strong> {{ formatDate(predictionDetail.endDate) }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Status:</strong>
                  <span [class]="getStatusClass()">{{ getStatusText() }}</span>
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Privacy:</strong> {{ predictionDetail.privacyType || 'Public' }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">
                <i class="fa fa-bolt me-2"></i>Quick Actions
              </h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-primary" (click)="editPrediction()" *ngIf="predictionDetail.isDraft">
                  <i class="fa fa-edit me-2"></i>Continue Editing
                </button>
                <button class="btn btn-success" (click)="publishPrediction()" *ngIf="predictionDetail.isDraft">
                  <i class="fa fa-globe me-2"></i>Publish Prediction
                </button>

                <button class="btn btn-info" (click)="viewCounterPredictions()"
                        *ngIf="!predictionDetail.isDraft && predictionDetail.counterPredictionsCount">
                  <i class="fa fa-users me-2"></i>View {{ predictionDetail.counterPredictionsCount }} Responses
                </button>
                <button class="btn btn-outline-secondary" (click)="sharePost()" *ngIf="!predictionDetail.isDraft">
                  <i class="fa fa-share me-2"></i>Share Prediction
                </button>

              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="card bg-dark border-dark mb-3" *ngIf="predictionDetail.categories && predictionDetail.categories.length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">
                <i class="fa fa-tags me-2"></i>Categories
              </h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                <span *ngFor="let category of predictionDetail.categories"
                      class="badge bg-primary"
                      [style.background-color]="category.colorCode || '#0d6efd'">
                  <i class="fa" [ngClass]="category.iconName" *ngIf="category.iconName" class="me-1"></i>
                  {{ category.name }}
                </span>
              </div>
            </div>
          </div>


      <!-- Debug Info -->
      <div class="card bg-dark border-dark mb-4" *ngIf="showDebugInfo">
        <div class="card-header bg-dark border-dark">
          <h5 class="text-light mb-0">Debug Information</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-light">Prediction Data:</h6>
              <pre class="text-light small">{{ predictionDetail | json }}</pre>
            </div>
            <div class="col-md-6">
              <h6 class="text-light">Type Checks:</h6>
              <pre class="text-light small">
PredictionType: {{ predictionDetail.predictionType }}
isRankingType(): {{ isRankingType() }}
isBingoType(): {{ isBingoType() }}
hasOriginalRankingData(): {{ hasOriginalRankingData() }}
hasOriginalBingoData(): {{ hasOriginalBingoData() }}
Available Teams: {{ getAvailableTeams().length }}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!predictionDetail && isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading your prediction...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!predictionDetail && !isLoading" class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-warning">Prediction Not Found</h5>
      <p class="text-muted">The prediction you're looking for doesn't exist or you don't have access to it.</p>
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

    .bingo-grid {
      max-width: 400px;
      margin: 0 auto;
    }

    .bingo-cell {
      border-radius: 8px;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .bingo-cell.has-team {
      background-color: #28a745;
      border-color: #1e7e34;
    }

    .bingo-cell.empty-cell {
      background-color: #6c757d;
      border-color: #495057;
    }

    .very-small {
      font-size: 0.7rem;
    }

    pre {
      max-height: 300px;
      overflow-y: auto;
      font-size: 0.8rem;
    }

    .list-group-item {
      padding: 0.5rem 0;
    }

    .dropdown-menu {
      background-color: #343a40;
      border-color: #495057;
    }

    .dropdown-item {
      color: #fff;
    }

    .dropdown-item:hover {
      background-color: #495057;
      color: #fff;
    }

    .dropdown-item.text-danger:hover {
      background-color: #dc3545;
      color: #fff;
    }

    .alert {
      border-radius: 8px;
    }

    code {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 0.25rem;
    }
  `]
})
export class MyPredictionViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  predictionDetail: MyPredictionDetail | null = null;
  isLoading = false;
  showDebugInfo = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.loadMyPredictionDetails(predictionId);
      }
    });
  }

  async loadMyPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Loading my prediction details for ID:', predictionId);

      // Use the my-prediction specific endpoint
      const response = await this.http.get<MyPredictionDetail>(
        `${environment.apiUrl}post/my-prediction/${predictionId}`
      ).toPromise();

      if (response) {
        // The API endpoint already verifies ownership, so we don't need to check here
        this.predictionDetail = response;
        console.log('My prediction details loaded:', this.predictionDetail);
      }
    } catch (error) {
      console.error('Error loading my prediction details:', error);
      this.toastr.error('Failed to load your prediction details');
      this.router.navigate(['/my-predictions']);
    } finally {
      this.isLoading = false;
    }
  }

  // TYPE CHECKING METHODS
  isRankingType(): boolean {
    const type = this.predictionDetail?.predictionType;
    return type === 'Ranking' || type === 0 || type === '0';
  }

  isBingoType(): boolean {
    const type = this.predictionDetail?.predictionType;
    return type === 'Bingo' || type === 2 || type === '2';
  }

  isBracketType(): boolean {
    const type = this.predictionDetail?.predictionType;
    return type === 'Bracket' || type === 1 || type === '1';
  }

  getPredictionTypeDisplayName(): string {
    if (this.isRankingType()) return 'Ranking';
    if (this.isBracketType()) return 'Bracket';
    if (this.isBingoType()) return 'Bingo';
    return `Unknown (${this.predictionDetail?.predictionType})`;
  }

  // STATUS METHODS
  getStatusText(): string {
    if (this.predictionDetail?.isDraft) return 'Draft';
    if (this.predictionDetail?.isActive) return 'Active';
    return 'Ended';
  }

  getStatusClass(): string {
    if (this.predictionDetail?.isDraft) return 'text-warning';
    if (this.predictionDetail?.isActive) return 'text-success';
    return 'text-secondary';
  }

  getDaysActive(): number {
    if (!this.predictionDetail?.createdAt) return 0;
    const now = new Date();
    const created = new Date(this.predictionDetail.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // RANKING DATA METHODS
  hasOriginalRankingData(): boolean {
    if (!this.isRankingType() || !this.predictionDetail?.postRanks) {
      return false;
    }

    const hasPostRanks = this.predictionDetail.postRanks.length > 0;
    const originalData = this.getOriginalRankingData();
    const hasRankTable = originalData?.rankTable?.rows && originalData.rankTable.rows.length > 0;

    return hasPostRanks && Boolean(hasRankTable);
  }

  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks || this.predictionDetail.postRanks.length === 0) {
      return null;
    }

    // Get the user's own ranking (should be the only one in "my prediction" view)
    const userRanking = this.predictionDetail.postRanks.find(pr => pr.userId === this.predictionDetail?.userId);
    return userRanking || this.predictionDetail.postRanks[0];
  }

  getOriginalRankingRows(): any[] {
    const originalData = this.getOriginalRankingData();
    return originalData?.rankTable?.rows || [];
  }

  getFirstRowColumns(): any[] {
    const rows = this.getOriginalRankingRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getAssignedTeamsCount(): number {
    const rows = this.getOriginalRankingRows();
    let count = 0;
    rows.forEach(row => {
      if (row.columns && Array.isArray(row.columns)) {
        row.columns.forEach((col: any) => {
          if (col.team) count++;
        });
      }
    });
    return count;
  }

  getTotalSlotsCount(): number {
    const originalData = this.getOriginalRankingData();
    if (!originalData?.rankTable) return 0;
    const rows = originalData.rankTable.numberOfRows || 0;
    const cols = originalData.rankTable.numberOfColumns || 0;
    return rows * cols;
  }

  // BINGO DATA METHODS
  hasOriginalBingoData(): boolean {
    if (!this.isBingoType() || !this.predictionDetail?.postBingos) {
      return false;
    }

    const hasPostBingos = this.predictionDetail.postBingos.length > 0;
    const originalData = this.getOriginalBingoData();
    const hasBingoCells = originalData?.bingoCells && originalData.bingoCells.length > 0;

    return hasPostBingos && Boolean(hasBingoCells);
  }

  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos || this.predictionDetail.postBingos.length === 0) {
      return null;
    }

    // Get the user's own bingo (should be the only one in "my prediction" view)
    const userBingo = this.predictionDetail.postBingos.find(pb => pb.userId === this.predictionDetail?.userId);
    return userBingo || this.predictionDetail.postBingos[0];
  }

  getOriginalBingoCells(): any[] {
    const originalData = this.getOriginalBingoData();
    return originalData?.bingoCells || [];
  }

  getFilledBingoCellsCount(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells)) return 0;
    return cells.filter(cell => cell && cell.team).length;
  }

  getBingoCompletionPercentage(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells) || cells.length === 0) return 0;
    const filled = this.getFilledBingoCellsCount();
    return Math.round((filled / cells.length) * 100);
  }

  getUniqueBingoTeamsCount(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells)) return 0;

    const teamIds = new Set();
    cells.forEach(cell => {
      if (cell && cell.team && cell.team.id) {
        teamIds.add(cell.team.id);
      }
    });
    return teamIds.size;
  }

  // GENERAL DATA METHODS
  hasOriginalPostData(): boolean {
    return this.hasOriginalRankingData() || this.hasOriginalBingoData();
  }

  getAvailableTeams(): any[] {
    // Extract teams from the current prediction data
    const teams: any[] = [];
    const seenTeamIds = new Set<number>();

    if (this.isRankingType() && this.hasOriginalRankingData()) {
      const originalData = this.getOriginalRankingData();
      originalData?.rankTable?.rows?.forEach((row: any) => {
        row.columns?.forEach((column: any) => {
          if (column.team && !seenTeamIds.has(column.team.id)) {
            seenTeamIds.add(column.team.id);
            teams.push(column.team);
          }
        });
      });
    } else if (this.isBingoType() && this.hasOriginalBingoData()) {
      const originalData = this.getOriginalBingoData();
      originalData?.bingoCells?.forEach((cell: any) => {
        if (cell.team && !seenTeamIds.has(cell.team.id)) {
          seenTeamIds.add(cell.team.id);
          teams.push(cell.team);
        }
      });
    }

    return teams;
  }

  // UTILITY METHODS
  formatDate(dateString: string | Date): string {
    if (!dateString || dateString === '0001-01-01T00:00:00' ||
        (typeof dateString === 'string' && dateString.startsWith('0001-01-01'))) {
      return 'Not available';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  // ACTION METHODS
  editPrediction(): void {
    if (this.predictionDetail) {
      this.router.navigate(['/create-prediction'], {
        queryParams: { edit: this.predictionDetail.id }
      });
    }
  }

  async publishPrediction(): Promise<void> {
    if (!this.predictionDetail) return;

    if (!confirm('Are you sure you want to publish this prediction? Once published, other users will be able to see and counter-predict it.')) {
      return;
    }

    try {
      await this.http.put(`${environment.apiUrl}prediction/${this.predictionDetail.id}/publish`, {}).toPromise();
      this.toastr.success('Prediction published successfully!');

      // Reload the prediction to get updated status
      this.loadMyPredictionDetails(this.predictionDetail.id);
    } catch (error) {
      console.error('Error publishing prediction:', error);
      this.toastr.error('Failed to publish prediction');
    }
  }


  viewCounterPredictions(): void {
    if (this.predictionDetail) {
      this.router.navigate(['/prediction-details', this.predictionDetail.id], {
        fragment: 'counter-predictions'
      });
    }
  }



  async deletePrediction(): Promise<void> {
    if (!this.predictionDetail) return;

    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}prediction/${this.predictionDetail.id}`).toPromise();
      this.toastr.success('Prediction deleted successfully');
      this.router.navigate(['/my-predictions']);
    } catch (error) {
      console.error('Error deleting prediction:', error);
      this.toastr.error('Failed to delete prediction');
    }
  }

  sharePost(): void {
    if (!this.predictionDetail) return;

    const url = `${window.location.origin}/prediction-details/${this.predictionDetail.id}`;

    if (navigator.share) {
      navigator.share({
        title: this.predictionDetail.title,
        text: this.predictionDetail.description,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Link copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy link');
      });
    }
  }

  copyAccessCode(): void {
    if (this.predictionDetail?.accessCode) {
      navigator.clipboard.writeText(this.predictionDetail.accessCode).then(() => {
        this.toastr.success('Access code copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy access code');
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
