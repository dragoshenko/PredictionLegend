// prediction-details.component.ts - FIXED VERSION
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

interface PredictionDetail {
  id: number;
  title: string;
  description: string;
  predictionType: string;
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

@Component({
  selector: 'app-prediction-details',
  imports: [CommonModule],
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

      <!-- Debug Info -->
      <div class="card bg-dark border-dark mb-4" *ngIf="showDebugInfo">
        <div class="card-header bg-dark border-dark">
          <h5 class="text-light mb-0">Debug Information</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-light">Raw Prediction Data:</h6>
              <pre class="text-light small">{{ predictionDetail | json }}</pre>
            </div>
            <div class="col-md-6">
              <h6 class="text-light">Original Post Data:</h6>
              <pre class="text-light small">{{ getOriginalPostData() | json }}</pre>
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
                          <img *ngIf="column.team.photoUrl" [src]="column.team.photoUrl"
                               class="rounded me-2" width="32" height="32" alt="Team">
                          <div>
                            <div class="fw-bold text-light">{{ column.team.name }}</div>
                            <div class="small text-muted">{{ column.team.description || 'No description' }}</div>
                          </div>
                        </div>
                        <div *ngIf="!column.team" class="text-muted small">
                          <i class="fa fa-minus"></i> Empty
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
                    <p class="text-light mb-1">
                      <strong>Total Rows:</strong> {{ getOriginalRankingData()?.rankTable?.numberOfRows || 0 }}
                    </p>
                    <p class="text-light mb-1">
                      <strong>Total Columns:</strong> {{ getOriginalRankingData()?.rankTable?.numberOfColumns || 0 }}
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p class="text-light mb-1">
                      <strong>Teams Assigned:</strong> {{ getAssignedTeamsCount() }}
                    </p>
                    <p class="text-light mb-1">
                      <strong>Total Score:</strong> {{ getOriginalRankingData()?.totalScore || 0 }}
                    </p>
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
                    <img *ngIf="cell.team.photoUrl" [src]="cell.team.photoUrl"
                         class="rounded mb-1" width="24" height="24" alt="Team">
                    <div class="small text-light fw-bold">{{ cell.team.name }}</div>
                    <div class="very-small text-muted">{{ cell.team.description || '' }}</div>
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
                <strong>Available Data:</strong>
                <ul class="list-unstyled mb-0">
                  <li *ngIf="predictionDetail.postRanks">PostRanks: {{ predictionDetail.postRanks.length }}</li>
                  <li *ngIf="predictionDetail.postBrackets">PostBrackets: {{ predictionDetail.postBrackets.length }}</li>
                  <li *ngIf="predictionDetail.postBingos">PostBingos: {{ predictionDetail.postBingos.length }}</li>
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
                <div>
                  <div class="fw-bold text-light">{{ predictionDetail.author.displayName || 'Unknown Author' }}</div>
                  <div class="small text-muted">Author</div>
                </div>
              </div>

              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Type:</strong> {{ getPredictionTypeDisplayName() }} ({{ predictionDetail.predictionType }})
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Created:</strong> {{ predictionDetail.createdAt | date:'medium' }}
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

          <!-- Categories -->
          <div class="card bg-dark border-dark" *ngIf="predictionDetail.categories && predictionDetail.categories.length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Categories</h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                <span *ngFor="let category of predictionDetail.categories"
                      class="badge bg-primary">
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
      }
    } catch (error) {
      console.error('Error loading prediction details:', error);
      this.toastr.error('Failed to load prediction details');
    } finally {
      this.isLoading = false;
    }
  }

  // Helper methods for ranking data
  hasOriginalRankingData(): boolean {
    // Handle both string and numeric prediction types
    const isRanking = this.predictionDetail?.predictionType === 'Ranking' ||
                     this.predictionDetail?.predictionType === '0';

    return isRanking &&
           this.predictionDetail?.postRanks &&
           this.predictionDetail.postRanks.length > 0 &&
           this.getOriginalRankingData()?.rankTable?.rows &&
           this.getOriginalRankingData()?.rankTable.rows.length > 0;
  }

  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks) return null;
    return this.predictionDetail.postRanks.find(pr => pr.userId === this.predictionDetail?.userId) ||
           this.predictionDetail.postRanks[0]; // Fallback to first post
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

  // Helper methods for bingo data
  hasOriginalBingoData(): boolean {
    return this.isBingoType() &&
           this.predictionDetail?.postBingos &&
           this.predictionDetail.postBingos.length > 0 &&
           this.getOriginalBingoData()?.bingoCells &&
           this.getOriginalBingoData()?.bingoCells.length > 0;
  }

  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos) return null;
    return this.predictionDetail.postBingos.find(pb => pb.userId === this.predictionDetail?.userId) ||
           this.predictionDetail.postBingos[0]; // Fallback to first post
  }

  getOriginalBingoCells(): any[] {
    const originalData = this.getOriginalBingoData();
    return originalData?.bingoCells || [];
  }

  // Helper methods for general data
  hasOriginalPostData(): boolean {
    return this.hasOriginalRankingData() || this.hasOriginalBingoData();
  }

  // Add type checking helper methods
  isRankingType(): boolean {
    return this.predictionDetail?.predictionType === 'Ranking' ||
           this.predictionDetail?.predictionType === '0';
  }

  isBingoType(): boolean {
    return this.predictionDetail?.predictionType === 'Bingo' ||
           this.predictionDetail?.predictionType === '2';
  }

  isBracketType(): boolean {
    return this.predictionDetail?.predictionType === 'Bracket' ||
           this.predictionDetail?.predictionType === '1';
  }

  getPredictionTypeDisplayName(): string {
    if (this.isRankingType()) return 'Ranking';
    if (this.isBracketType()) return 'Bracket';
    if (this.isBingoType()) return 'Bingo';
    return 'Unknown';
  }

  getOriginalPostData(): any {
    if (this.isRankingType()) {
      return this.getOriginalRankingData();
    } else if (this.isBingoType()) {
      return this.getOriginalBingoData();
    }
    return null;
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
