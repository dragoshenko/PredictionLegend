// prediction-details.component.ts - ENHANCED WITH COUNTER-PREDICTION
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { CounterPredictionComponent } from '../counter-prediction/counter-prediction.component';

interface PredictionDetail {
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
}

interface TeamData {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  score?: number;
  createdByUserId: number;
  createdAt: Date;
}

@Component({
  selector: 'app-prediction-details',
  imports: [CommonModule, CounterPredictionComponent],
  template: `
    <div class="container-fluid mt-4" *ngIf="predictionDetail">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">{{ predictionDetail.title }}</h2>
              <p class="text-light mb-0 opacity-75">{{ predictionDetail.description }}</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>
              <button class="btn btn-info" (click)="showDebugInfo = !showDebugInfo">
                <i class="fa fa-bug me-2"></i>{{ showDebugInfo ? 'Hide' : 'Show' }} Debug
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Counter Prediction Section -->
      <div class="mb-4">
        <!-- Debug info for counter prediction -->
        <div class="card bg-warning border-warning mb-3" *ngIf="showDebugInfo">
          <div class="card-body">
            <h6 class="text-dark mb-2">Counter Prediction Debug</h6>
            <div class="row">
              <div class="col-md-6">
                <ul class="list-unstyled text-dark small mb-0">
                  <li><strong>Can show counter prediction:</strong> {{ canShowCounterPrediction() }}</li>
                  <li><strong>Current user ID:</strong> {{ getCurrentUserId() }}</li>
                  <li><strong>Prediction author ID:</strong> {{ predictionDetail.userId }}</li>
                  <li><strong>Is draft:</strong> {{ predictionDetail.isDraft }}</li>
                  <li><strong>Is active:</strong> {{ predictionDetail.isActive }}</li>
                  <li><strong>Has original post data:</strong> {{ hasOriginalPostData() }}</li>
                  <li><strong>Available teams count:</strong> {{ getAvailableTeams().length }}</li>
                  <li><strong>Template data:</strong> {{ getTemplateData() ? 'Available' : 'Missing' }}</li>
                </ul>
              </div>
              <div class="col-md-6">
                <h6 class="text-dark">Raw Data Structure:</h6>
                <pre class="text-dark small" style="max-height: 200px; overflow-y: auto;">
PostRanks: {{ predictionDetail.postRanks?.length || 0 }}
PostBingos: {{ predictionDetail.postBingos?.length || 0 }}
First PostRank Structure:
{{ getDebugRankingStructure() }}
                </pre>
              </div>
            </div>
            <div class="mt-2">
              <h6 class="text-dark">Available Teams:</h6>
              <div class="d-flex flex-wrap gap-1">
                <span *ngFor="let team of getAvailableTeams()" class="badge bg-primary small">
                  {{ team.name }}
                </span>
                <span *ngIf="getAvailableTeams().length === 0" class="text-danger">
                  No teams found - this is the problem!
                </span>
              </div>
            </div>
          </div>
        </div>

        <app-counter-prediction
          *ngIf="canShowCounterPrediction()"
          [originalPrediction]="predictionDetail"
          [template]="getTemplateData()"
          [availableTeams]="getAvailableTeams()">
        </app-counter-prediction>

        <!-- Message when counter prediction is not available -->
        <div class="card bg-secondary border-secondary" *ngIf="!canShowCounterPrediction() && predictionDetail">
          <div class="card-body text-center">
            <i class="fa fa-info-circle fa-2x text-light mb-3"></i>
            <h5 class="text-light">Counter Prediction Not Available</h5>
            <p class="text-light mb-2">{{ getCounterPredictionUnavailableReason() }}</p>
            <button class="btn btn-outline-light btn-sm" (click)="showDebugInfo = true" *ngIf="!showDebugInfo">
              Show Debug Info
            </button>
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
            <div class="col-md-4">
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
            <div class="col-md-4">
              <h6 class="text-light">Post Data Counts:</h6>
              <pre class="text-light small">
PostRanks: {{ predictionDetail.postRanks?.length || 0 }}
PostBingos: {{ predictionDetail.postBingos?.length || 0 }}
PostBrackets: {{ predictionDetail.postBrackets?.length || 0 }}
              </pre>
            </div>
            <div class="col-md-4">
              <h6 class="text-light">Template Data:</h6>
              <pre class="text-light small">{{ getTemplateData() | json }}</pre>
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <h6 class="text-light">Available Teams:</h6>
              <pre class="text-light small">{{ getAvailableTeams() | json }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row mb-4">
        <div class="col-md-8">
          <!-- Original Ranking Prediction -->
          <div *ngIf="isRankingType() && hasOriginalRankingData()"
               class="card bg-secondary border-secondary mb-4">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-list-ol me-2"></i>Original Ranking Prediction
              </h4>
              <div class="small text-light opacity-75">
                Total Score: {{ getOriginalRankingData()?.totalScore || 0 }}
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
                    <tr *ngFor="let row of getOriginalRankingRows(); let rowIndex = index; trackBy: trackByRowId">
                      <td class="fw-bold text-warning">#{{ row.order }}</td>
                      <td *ngFor="let column of row.columns || []; trackBy: trackByColumnId">
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
                            <div class="small text-muted" *ngIf="column.team.description && column.team.description.trim()">
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

              <!-- Additional Info -->
              <div class="mt-3">
                <div class="row">
                  <div class="col-md-6">
                    <div class="card bg-dark border-dark">
                      <div class="card-body py-2">
                        <h6 class="text-light mb-2">Structure Info</h6>
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
                        <h6 class="text-light mb-2">Prediction Info</h6>
                        <p class="text-light mb-1 small">
                          <strong>Created:</strong> {{ formatDate(getOriginalRankingData()?.createdAt) }}
                        </p>
                        <p class="text-light mb-1 small">
                          <strong>Updated:</strong> {{ formatDate(getOriginalRankingData()?.updatedAt) }}
                        </p>
                        <p class="text-light mb-0 small">
                          <strong>Official Result:</strong>
                          <span [class]="getOriginalRankingData()?.isOfficialResult ? 'text-success' : 'text-warning'">
                            {{ getOriginalRankingData()?.isOfficialResult ? 'Yes' : 'No' }}
                          </span>
                        </p>
                      </div>
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
                <i class="fa fa-th me-2"></i>Original Bingo Prediction
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

                <div *ngFor="let cell of getOriginalBingoCells(); let cellIndex = index; trackBy: trackByCellIndex"
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
                    <div class="very-small text-muted" *ngIf="cell.team.description && cell.team.description.trim()">
                      {{ cell.team.description }}
                    </div>
                  </div>
                  <div *ngIf="!cell.team" class="text-muted">
                    <i class="fa fa-square-o fa-lg"></i>
                    <div class="very-small mt-1">Empty</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Original Post Data -->
          <div *ngIf="!hasOriginalPostData()" class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-exclamation-triangle fa-2x mb-3 text-dark"></i>
              <h5 class="text-dark">No Original Post Data Found</h5>
              <p class="text-dark mb-2">
                This {{ getPredictionTypeDisplayName().toLowerCase() }} prediction doesn't have any original post data yet.
              </p>
              <div class="small text-dark">
                <strong>Debug Info:</strong>
                <ul class="list-unstyled mb-0">
                  <li>Prediction Type: {{ predictionDetail.predictionType }} ({{ getPredictionTypeDisplayName() }})</li>
                  <li>Is Ranking: {{ isRankingType() }}</li>
                  <li>Is Bingo: {{ isBingoType() }}</li>
                  <li>PostRanks: {{ predictionDetail.postRanks?.length || 0 }}</li>
                  <li>PostBingos: {{ predictionDetail.postBingos?.length || 0 }}</li>
                  <li>PostBrackets: {{ predictionDetail.postBrackets?.length || 0 }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-md-4">
          <!-- Prediction Info -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Prediction Info</h5>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-3" *ngIf="predictionDetail.author">
                <img *ngIf="predictionDetail.author.photoUrl" [src]="predictionDetail.author.photoUrl"
                     class="rounded-circle me-3" width="48" height="48" alt="Author">
                <div class="bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center"
                     *ngIf="!predictionDetail.author.photoUrl"
                     style="width: 48px; height: 48px;">
                  <i class="fa fa-user text-white"></i>
                </div>
                <div>
                  <div class="fw-bold text-light">{{ predictionDetail.author.displayName || 'Unknown Author' }}</div>
                  <div class="small text-muted">Author</div>
                </div>
              </div>

              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Type:</strong> {{ getPredictionTypeDisplayName() }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Created:</strong> {{ getOriginalRankingData()?.createdAt | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light" *ngIf="predictionDetail.endDate">
                  <strong>Ends:</strong> {{ predictionDetail.endDate | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Status:</strong>
                  <span [class]="predictionDetail.isActive ? 'text-success' : 'text-warning'">
                    {{ predictionDetail.isActive ? 'Active' : 'Ended' }}
                  </span>
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Draft:</strong>
                  <span [class]="predictionDetail.isDraft ? 'text-warning' : 'text-success'">
                    {{ predictionDetail.isDraft ? 'Yes' : 'No' }}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Teams List -->
          <div class="card bg-dark border-dark mb-3" *ngIf="getAvailableTeams().length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Available Teams ({{ getAvailableTeams().length }})</h5>
            </div>
            <div class="card-body">
              <div class="list-group list-group-flush">
                <div *ngFor="let team of getAvailableTeams().slice(0, 5)"
                     class="list-group-item bg-transparent border-secondary text-light p-2">
                  <div class="d-flex align-items-center">
                    <img *ngIf="team.photoUrl && team.photoUrl.trim()"
                         [src]="team.photoUrl"
                         class="rounded me-2"
                         width="24" height="24"
                         alt="Team">
                    <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                         *ngIf="!team.photoUrl || !team.photoUrl.trim()"
                         style="width: 24px; height: 24px;">
                      <i class="fa fa-users text-white" style="font-size: 10px;"></i>
                    </div>
                    <div>
                      <div class="fw-bold small">{{ team.name }}</div>
                      <div class="very-small text-muted" *ngIf="team.description">{{ team.description }}</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="getAvailableTeams().length > 5"
                     class="list-group-item bg-transparent border-secondary text-center">
                  <small class="text-muted">+{{ getAvailableTeams().length - 5 }} more teams</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="card bg-dark border-dark" *ngIf="predictionDetail.categories && predictionDetail.categories.length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Categories</h5>
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
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!predictionDetail && isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading prediction details...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!predictionDetail && !isLoading" class="text-center py-5">
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
  `]
})
export class PredictionDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  predictionDetail: PredictionDetail | null = null;
  isLoading = false;
  showDebugInfo = false;

  // TrackBy functions for performance
  trackByRowId = (index: number, row: any): any => row.id || index;
  trackByColumnId = (index: number, column: any): any => column.id || index;
  trackByCellIndex = (index: number, cell: any): any => `${cell.row}-${cell.column}` || index;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.loadPredictionDetails(predictionId);
      }
    });

    // Check for action parameter to auto-show counter prediction
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'counter-predict') {
        // Wait for prediction to load, then show counter prediction
        setTimeout(() => {
          this.autoShowCounterPrediction();
        }, 1000);
      }
    });
  }

  async loadPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Loading prediction details for ID:', predictionId);

      const response = await this.http.get<PredictionDetail>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      if (response) {
        this.predictionDetail = response;
        console.log('Prediction details loaded:', this.predictionDetail);
        console.log('PostRanks:', this.predictionDetail.postRanks);
        console.log('PostBingos:', this.predictionDetail.postBingos);
        console.log('PostBrackets:', this.predictionDetail.postBrackets);

        // Log type checking results
        console.log('Type checks:');
        console.log('- predictionType:', this.predictionDetail.predictionType);
        console.log('- isRankingType:', this.isRankingType());
        console.log('- isBingoType:', this.isBingoType());
        console.log('- hasOriginalRankingData:', this.hasOriginalRankingData());
        console.log('- hasOriginalBingoData:', this.hasOriginalBingoData());
        console.log('- availableTeams:', this.getAvailableTeams().length);
      }
    } catch (error) {
      console.error('Error loading prediction details:', error);
      this.toastr.error('Failed to load prediction details');
    } finally {
      this.isLoading = false;
    }
  }

  // COUNTER PREDICTION METHODS
  canShowCounterPrediction(): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser || !this.predictionDetail) {
      console.log('No user or prediction detail');
      return false;
    }

    // Don't show for own predictions
    if (this.predictionDetail.userId === currentUser.id) {
      console.log('Own prediction - cannot counter predict');
      return false;
    }

    // Don't show for draft predictions
    if (this.predictionDetail.isDraft) {
      console.log('Draft prediction - cannot counter predict');
      return false;
    }

    // Only show for active predictions
    if (!this.predictionDetail.isActive) {
      console.log('Inactive prediction - cannot counter predict');
      return false;
    }

    // Only show if we have original post data and teams
    const hasPostData = this.hasOriginalPostData();
    const availableTeams = this.getAvailableTeams();
    const hasTeams = availableTeams.length > 0;

    console.log('Counter prediction eligibility check:', {
      hasPostData,
      hasTeams,
      teamsCount: availableTeams.length,
      canShow: hasPostData && hasTeams
    });

    return hasPostData && hasTeams;
  }

  getTemplateData(): any {
    const originalData = this.getOriginalPostData();
    if (!originalData) return null;

    if (this.isRankingType()) {
      const rankingData = this.getOriginalRankingData();
      return {
        id: rankingData?.rankingTemplateId || 1,
        numberOfRows: rankingData?.rankTable?.numberOfRows || 5,
        numberOfColumns: rankingData?.rankTable?.numberOfColumns || 1,
        name: 'Ranking Template'
      };
    } else if (this.isBingoType()) {
      const bingoData = this.getOriginalBingoData();
      return {
        id: bingoData?.bingoTemplateId || 1,
        gridSize: bingoData?.gridSize || 5,
        name: 'Bingo Template'
      };
    }

    return null;
  }

  getAvailableTeams(): TeamData[] {
    console.log('=== Getting Available Teams ===');

    // For ranking predictions, extract teams from the rank table
    if (this.isRankingType() && this.hasOriginalRankingData()) {
      const originalRankingData = this.getOriginalRankingData();
      console.log('Original ranking data:', originalRankingData);

      const teams: TeamData[] = [];
      const seenTeamIds = new Set<number>();

      // Extract teams from all rows and columns in the ranking table
      if (originalRankingData?.rankTable?.rows) {
        originalRankingData.rankTable.rows.forEach((row: any) => {
          if (row.columns) {
            row.columns.forEach((column: any) => {
              if (column.team && !seenTeamIds.has(column.team.id)) {
                seenTeamIds.add(column.team.id);
                teams.push({
                  id: column.team.id,
                  name: column.team.name || 'Unnamed Team',
                  description: column.team.description || '',
                  photoUrl: column.team.photoUrl || '',
                  score: column.team.score || 0,
                  createdByUserId: column.team.createdByUserId || 0,
                  createdAt: column.team.createdAt ? new Date(column.team.createdAt) : new Date()
                });
              }
            });
          }
        });
      }

      console.log('Teams extracted from ranking table:', teams);
      return teams;
    }

    // For bingo predictions, extract teams from bingo cells
    if (this.isBingoType() && this.hasOriginalBingoData()) {
      const originalBingoData = this.getOriginalBingoData();
      console.log('Original bingo data:', originalBingoData);

      const teams: TeamData[] = [];
      const seenTeamIds = new Set<number>();

      // Extract teams from bingo cells
      if (originalBingoData?.bingoCells) {
        originalBingoData.bingoCells.forEach((cell: any) => {
          if (cell.team && !seenTeamIds.has(cell.team.id)) {
            seenTeamIds.add(cell.team.id);
            teams.push({
              id: cell.team.id,
              name: cell.team.name || 'Unnamed Team',
              description: cell.team.description || '',
              photoUrl: cell.team.photoUrl || '',
              score: cell.team.score || 0,
              createdByUserId: cell.team.createdByUserId || 0,
              createdAt: cell.team.createdAt ? new Date(cell.team.createdAt) : new Date()
            });
          }
        });
      }

      console.log('Teams extracted from bingo cells:', teams);
      return teams;
    }

    // Fallback: Try to get teams from the teams array if it exists
    const originalPostData = this.getOriginalPostData();
    if (originalPostData?.teams && Array.isArray(originalPostData.teams)) {
      const teams = originalPostData.teams.map((team: any) => ({
        id: team.id,
        name: team.name || 'Unnamed Team',
        description: team.description || '',
        photoUrl: team.photoUrl || '',
        score: team.score || 0,
        createdByUserId: team.createdByUserId || 0,
        createdAt: team.createdAt ? new Date(team.createdAt) : new Date()
      }));

      console.log('Teams extracted from teams array:', teams);
      return teams;
    }

    console.warn('No teams found in prediction data');
    console.log('Prediction detail:', this.predictionDetail);
    console.log('Original post data:', this.getOriginalPostData());

    return [];
  }

  // HELPER METHODS FOR RANKING DATA
  hasOriginalRankingData(): boolean {
    const isRanking = this.isRankingType();
    const hasPostRanks = this.predictionDetail?.postRanks && this.predictionDetail.postRanks.length > 0;
    const originalData = this.getOriginalRankingData();
    const hasRankTable = originalData?.rankTable?.rows && originalData.rankTable.rows.length > 0;

    console.log('hasOriginalRankingData check:', {
      isRanking,
      hasPostRanks,
      originalData: !!originalData,
      hasRankTable,
      finalResult: isRanking && hasPostRanks && hasRankTable
    });

    return isRanking && hasPostRanks && hasRankTable;
  }

  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks || this.predictionDetail.postRanks.length === 0) {
      return null;
    }

    // Try to find the post by the prediction author first
    const originalPost = this.predictionDetail.postRanks.find(pr => pr.userId === this.predictionDetail?.userId);
    if (originalPost) {
      return originalPost;
    }

    // Fallback to the first post
    return this.predictionDetail.postRanks[0];
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
      row.columns?.forEach((col: any) => {
        if (col.team) count++;
      });
    });
    return count;
  }

  getTotalSlotsCount(): number {
    const originalData = this.getOriginalRankingData();
    if (!originalData?.rankTable) return 0;
    return (originalData.rankTable.numberOfRows || 0) * (originalData.rankTable.numberOfColumns || 0);
  }

  // HELPER METHODS FOR BINGO DATA
  hasOriginalBingoData(): boolean {
    const isBingo = this.isBingoType();
    const hasPostBingos = this.predictionDetail?.postBingos && this.predictionDetail.postBingos.length > 0;
    const originalData = this.getOriginalBingoData();
    const hasBingoCells = originalData?.bingoCells && originalData.bingoCells.length > 0;

    console.log('hasOriginalBingoData check:', {
      isBingo,
      hasPostBingos,
      originalData: !!originalData,
      hasBingoCells,
      finalResult: isBingo && hasPostBingos && hasBingoCells
    });

    return isBingo && hasPostBingos && hasBingoCells;
  }

  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos || this.predictionDetail.postBingos.length === 0) {
      return null;
    }

    // Try to find the post by the prediction author first
    const originalPost = this.predictionDetail.postBingos.find(pb => pb.userId === this.predictionDetail?.userId);
    if (originalPost) {
      return originalPost;
    }

    // Fallback to the first post
    return this.predictionDetail.postBingos[0];
  }

  getOriginalBingoCells(): any[] {
    const originalData = this.getOriginalBingoData();
    return originalData?.bingoCells || [];
  }

  // Helper methods for general data
  hasOriginalPostData(): boolean {
    return this.hasOriginalRankingData() || this.hasOriginalBingoData();
  }

  // TYPE CHECKING HELPER METHODS - Handle both string and numeric types
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

  getOriginalPostData(): any {
    if (this.isRankingType()) {
      return this.getOriginalRankingData();
    } else if (this.isBingoType()) {
      return this.getOriginalBingoData();
    }
    return null;
  }

  // Format date helper - handles invalid dates
  formatDate(dateString: string): string {
    if (!dateString || dateString === '0001-01-01T00:00:00' || dateString.startsWith('0001-01-01')) {
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

  // Handle image load errors
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  // Auto-show counter prediction when coming from "counter predict" button
  autoShowCounterPrediction(): void {
    console.log('Auto-showing counter prediction...');
    console.log('Can show counter prediction:', this.canShowCounterPrediction());
    console.log('Available teams:', this.getAvailableTeams().length);

    if (this.canShowCounterPrediction()) {
      // Force the counter prediction component to show its form
      const counterPredictionElement = document.querySelector('app-counter-prediction');
      if (counterPredictionElement) {
        // Scroll to the counter prediction section
        counterPredictionElement.scrollIntoView({ behavior: 'smooth' });
        this.toastr.info('Create your counter prediction below!', 'Counter Prediction');
      }
    } else {
      this.toastr.warning('Counter prediction is not available for this post');
    }
  }

  getCurrentUserId(): number {
    return this.accountService.currentUser()?.id || 0;
  }

  getCounterPredictionUnavailableReason(): string {
    const currentUser = this.accountService.currentUser();

    if (!currentUser) {
      return 'You must be logged in to create counter predictions.';
    }

    if (!this.predictionDetail) {
      return 'Prediction data is still loading...';
    }

    if (this.predictionDetail.userId === currentUser.id) {
      return 'You cannot counter-predict your own prediction.';
    }

    if (this.predictionDetail.isDraft) {
      return 'Counter predictions are not available for draft predictions.';
    }

    if (!this.predictionDetail.isActive) {
      return 'This prediction is no longer active.';
    }

    if (!this.hasOriginalPostData()) {
      return 'This prediction doesn\'t have any post data yet.';
    }

    if (this.getAvailableTeams().length === 0) {
      return 'No teams are available for counter prediction.';
    }

    return 'Counter prediction is not available for this post.';
  }

  getDebugRankingStructure(): string {
    const originalData = this.getOriginalRankingData();
    if (!originalData) return 'No ranking data';

    const structure = {
      id: originalData.id,
      userId: originalData.userId,
      rankTable: {
        numberOfRows: originalData.rankTable?.numberOfRows,
        numberOfColumns: originalData.rankTable?.numberOfColumns,
        rowsCount: originalData.rankTable?.rows?.length,
        firstRowColumnsCount: originalData.rankTable?.rows?.[0]?.columns?.length,
        firstColumnTeam: originalData.rankTable?.rows?.[0]?.columns?.[0]?.team?.name || 'No team'
      },
      teamsArrayLength: originalData.teams?.length || 0
    };

    return JSON.stringify(structure, null, 2);
  }

  goBack(): void {
    this.router.navigate(['/published-posts']);
  }
}
