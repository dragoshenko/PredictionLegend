// client/src/app/prediction-results/prediction-results.component.ts
import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

interface PredictionResults {
  predictionId: number;
  title: string;
  predictionType: string;
  resultsPublishedAt: Date;
  resultsNotes?: string;
  author: any;
  officialResults?: any;
  officialBracketResults?: any;
  officialBingoResults?: any;
  scoredCounterPredictions: ScoredCounterPrediction[];
  stats: ResultsStats;
}

interface ScoredCounterPrediction {
  id: number;
  author: any;
  createdAt: Date;
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  rank: number;
  scoredPostRank?: any;
  scoredPostBracket?: any;
  scoredPostBingo?: any;
}

interface ResultsStats {
  totalCounterPredictions: number;
  totalParticipants: number;
  averageAccuracy: number;
  highestAccuracy: number;
  lowestAccuracy: number;
  bestPrediction?: ScoredCounterPrediction;
}

interface PublishResultsRequest {
  predictionId: number;
  predictionType: string;
  notes?: string;
  resultsPostRank?: any;
  resultsPostBracket?: any;
  resultsPostBingo?: any;
}

@Component({
  selector: 'app-prediction-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="prediction-results-container">
      <!-- Publishing Results Mode -->
      <div *ngIf="publishMode && !results" class="card bg-warning border-warning mb-4">
        <div class="card-header bg-warning border-warning">
          <h4 class="text-dark mb-0">
            <i class="fa fa-trophy me-2"></i>Publish Official Results
          </h4>
          <p class="text-dark mb-0 opacity-75">
            Enter the actual results to score all counter predictions
          </p>
        </div>
        <div class="card-body">
          <form (ngSubmit)="publishResults()" #resultsForm="ngForm">
            <!-- Notes -->
            <div class="mb-3">
              <label class="form-label text-dark fw-bold">Results Notes (Optional)</label>
              <textarea
                class="form-control bg-dark text-light border-secondary"
                [(ngModel)]="publishRequest.notes"
                name="notes"
                rows="3"
                placeholder="Add any notes about the final results...">
              </textarea>
            </div>

            <!-- Ranking Results -->
            <div *ngIf="predictionType === 'Ranking'" class="mb-4">
              <h5 class="text-dark mb-3">Official Ranking Results</h5>
              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                Enter the teams in their final positions. Counter predictions will be scored based on exact position matches.
              </div>

              <app-ranking-editor
                [template]="originalTemplate"
                [availableTeams]="availableTeams"
                [(rankingData)]="publishRequest.resultsPostRank"
                [readonly]="false">
              </app-ranking-editor>
            </div>

            <!-- Bingo Results -->
            <div *ngIf="predictionType === 'Bingo'" class="mb-4">
              <h5 class="text-dark mb-3">Official Bingo Results</h5>
              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                Select which teams ended up in each bingo cell. Counter predictions will be scored based on exact matches.
              </div>

              <app-bingo-editor
                [template]="originalTemplate"
                [availableTeams]="availableTeams"
                [(bingoData)]="publishRequest.resultsPostBingo"
                [readonly]="false">
              </app-bingo-editor>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-warning" [disabled]="isPublishing || !canPublish()">
                <i class="fa fa-trophy me-2"></i>
                <span *ngIf="!isPublishing">Publish Results & Score Predictions</span>
                <span *ngIf="isPublishing">Publishing...</span>
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancelPublish()">
                <i class="fa fa-times me-2"></i>Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Published Results Display -->
      <div *ngIf="results" class="results-display">
        <!-- Results Header -->
        <div class="card bg-success border-success mb-4">
          <div class="card-header bg-success border-success">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h3 class="text-light mb-1">
                  <i class="fa fa-trophy me-2"></i>Official Results Published
                </h3>
                <p class="text-light mb-0 opacity-75">
                  Results for "{{ results.title }}" - Published {{ formatDate(results.resultsPublishedAt) }}
                </p>
              </div>
              <div *ngIf="canRecalculateScores()">
                <button class="btn btn-outline-light btn-sm" (click)="recalculateScores()">
                  <i class="fa fa-refresh me-1"></i>Recalculate Scores
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Notes -->
        <div *ngIf="results.resultsNotes" class="card bg-info border-info mb-4">
          <div class="card-body">
            <h6 class="text-light"><i class="fa fa-sticky-note me-2"></i>Results Notes</h6>
            <p class="text-light mb-0">{{ results.resultsNotes }}</p>
          </div>
        </div>

        <!-- Statistics Summary -->
        <div class="card bg-dark border-dark mb-4">
          <div class="card-header bg-dark border-dark">
            <h5 class="text-light mb-0">
              <i class="fa fa-chart-bar me-2"></i>Results Summary
            </h5>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-2 mb-3">
                <div class="h4 text-primary">{{ results.stats.totalCounterPredictions }}</div>
                <div class="small text-muted">Total Predictions</div>
              </div>
              <div class="col-md-2 mb-3">
                <div class="h4 text-success">{{ results.stats.totalParticipants }}</div>
                <div class="small text-muted">Participants</div>
              </div>
              <div class="col-md-2 mb-3">
                <div class="h4 text-info">{{ results.stats.averageAccuracy.toFixed(1) }}%</div>
                <div class="small text-muted">Average Accuracy</div>
              </div>
              <div class="col-md-2 mb-3">
                <div class="h4 text-warning">{{ results.stats.highestAccuracy.toFixed(1) }}%</div>
                <div class="small text-muted">Best Score</div>
              </div>
              <div class="col-md-2 mb-3">
                <div class="h4 text-secondary">{{ results.stats.lowestAccuracy.toFixed(1) }}%</div>
                <div class="small text-muted">Lowest Score</div>
              </div>
              <div class="col-md-2 mb-3" *ngIf="results.stats.bestPrediction">
                <div class="h6 text-warning">{{ results.stats.bestPrediction.author.displayName }}</div>
                <div class="small text-muted">Top Performer</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Official Results Display -->
        <div class="card bg-secondary border-secondary mb-4">
          <div class="card-header bg-secondary border-secondary">
            <h5 class="text-light mb-0">
              <i class="fa fa-trophy me-2 text-warning"></i>Official {{ predictionType }} Results
            </h5>
          </div>
          <div class="card-body">
            <!-- Official Ranking Display -->
            <div *ngIf="predictionType === 'Ranking' && results.officialResults">
              <div class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th *ngFor="let col of getOfficialRankingFirstRow(); let i = index">
                        Position {{ i + 1 }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of getOfficialRankingRows(); let rowIndex = index">
                      <td class="fw-bold text-warning">#{{ row.order }}</td>
                      <td *ngFor="let column of row.columns || []">
                        <div *ngIf="column.team" class="d-flex align-items-center">
                          <img *ngIf="column.team.photoUrl" [src]="column.team.photoUrl"
                               class="rounded me-2" width="32" height="32" alt="Team">
                          <div class="bg-warning rounded-circle me-2 d-flex align-items-center justify-content-center"
                               *ngIf="!column.team.photoUrl"
                               style="width: 32px; height: 32px;">
                            <i class="fa fa-trophy text-dark"></i>
                          </div>
                          <div>
                            <div class="fw-bold text-light">{{ column.team.name }}</div>
                            <div class="small text-success">
                              <i class="fa fa-check-circle me-1"></i>Official Result
                            </div>
                          </div>
                        </div>
                        <div *ngIf="!column.team" class="text-muted text-center">
                          <i class="fa fa-minus-circle"></i> No Team
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Official Bingo Display -->
            <div *ngIf="predictionType === 'Bingo' && results.officialBingoResults">
              <div class="bingo-grid-official"
                   [style.grid-template-columns]="'repeat(' + results.officialBingoResults.gridSize + ', 1fr)'"
                   [style.gap]="'8px'"
                   [style.display]="'grid'"
                   [style.max-width]="'400px'"
                   [style.margin]="'0 auto'">

                <div *ngFor="let cell of getOfficialBingoCells()"
                     class="bingo-cell-official p-2 border border-warning text-center bg-warning">
                  <div *ngIf="cell.team">
                    <img *ngIf="cell.team.photoUrl" [src]="cell.team.photoUrl"
                         class="rounded mb-1" width="24" height="24" alt="Team">
                    <div class="bg-dark rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                         *ngIf="!cell.team.photoUrl"
                         style="width: 24px; height: 24px;">
                      <i class="fa fa-trophy text-warning" style="font-size: 10px;"></i>
                    </div>
                    <div class="small text-dark fw-bold">{{ cell.team.name }}</div>
                  </div>
                  <div *ngIf="!cell.team" class="text-secondary">
                    <i class="fa fa-square-o fa-lg"></i>
                    <div class="very-small mt-1">Empty</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scored Counter Predictions Leaderboard -->
        <div class="card bg-dark border-dark">
          <div class="card-header bg-dark border-dark">
            <h5 class="text-light mb-0">
              <i class="fa fa-list-ol me-2"></i>Leaderboard - Counter Predictions Scored
            </h5>
          </div>
          <div class="card-body">
            <div *ngFor="let prediction of results.scoredCounterPredictions; let i = index"
                 class="card border-primary mb-3"
                 [class.border-warning]="i === 0"
                 [class.bg-warning]="i === 0"
                 [class.bg-secondary]="i !== 0">

              <!-- Prediction Header -->
              <div class="card-header"
                   [class.bg-warning]="i === 0"
                   [class.bg-secondary]="i !== 0"
                   [class.border-warning]="i === 0"
                   [class.border-primary]="i !== 0">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <!-- Rank Badge -->
                    <div class="rank-badge me-3"
                         [class.rank-first]="i === 0"
                         [class.rank-second]="i === 1"
                         [class.rank-third]="i === 2"
                         [class.rank-other]="i > 2">
                      <span class="rank-number">{{ prediction.rank }}</span>
                      <i *ngIf="i === 0" class="fa fa-crown rank-icon"></i>
                      <i *ngIf="i === 1" class="fa fa-medal rank-icon"></i>
                      <i *ngIf="i === 2" class="fa fa-trophy rank-icon"></i>
                    </div>

                    <!-- Author Info -->
                    <div class="d-flex align-items-center">
                      <img *ngIf="prediction.author.photoUrl" [src]="prediction.author.photoUrl"
                           class="rounded-circle me-2" width="40" height="40" alt="Author">
                      <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                           *ngIf="!prediction.author.photoUrl"
                           style="width: 40px; height: 40px;">
                        <i class="fa fa-user text-white"></i>
                      </div>
                      <div>
                        <h6 class="mb-0" [class.text-dark]="i === 0" [class.text-light]="i !== 0">
                          {{ prediction.author.displayName }}
                        </h6>
                        <small [class.text-dark]="i === 0" [class.text-muted]="i !== 0">
                          Submitted {{ formatDate(prediction.createdAt) }}
                        </small>
                      </div>
                    </div>
                  </div>

                  <!-- Score Info -->
                  <div class="text-end">
                    <div class="h5 mb-0" [class.text-dark]="i === 0" [class.text-light]="i !== 0">
                      {{ prediction.accuracyPercentage.toFixed(1) }}%
                    </div>
                    <small [class.text-dark]="i === 0" [class.text-muted]="i !== 0">
                      {{ prediction.correctCount }}/{{ prediction.correctCount + prediction.incorrectCount }} correct
                    </small>
                  </div>
                </div>
              </div>

              <!-- Scored Prediction Display -->
              <div class="card-body">
                <!-- Scored Ranking -->
                <div *ngIf="predictionType === 'Ranking' && prediction.scoredPostRank">
                  <div class="table-responsive">
                    <table class="table table-sm"
                           [class.table-dark]="i !== 0"
                           [class.table-light]="i === 0">
                      <thead>
                        <tr>
                          <th width="60">Rank</th>
                          <th *ngFor="let col of getScoredRankingFirstRow(prediction); let j = index">
                            Pos {{ j + 1 }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of getScoredRankingRows(prediction)">
                          <td class="fw-bold">#{{ row.order }}</td>
                          <td *ngFor="let column of row.columns || []"
                              [class.bg-success]="column.officialScore > 0"
                              [class.bg-danger]="column.officialScore === 0 && column.team">
                            <div *ngIf="column.team" class="d-flex align-items-center p-1">
                              <img *ngIf="column.team.photoUrl" [src]="column.team.photoUrl"
                                   class="rounded me-1" width="20" height="20" alt="Team">
                              <div class="rounded-circle me-1 d-flex align-items-center justify-content-center"
                                   [class.bg-success]="column.officialScore > 0"
                                   [class.bg-danger]="column.officialScore === 0"
                                   *ngIf="!column.team.photoUrl"
                                   style="width: 20px; height: 20px;">
                                <i [class.fa-check]="column.officialScore > 0"
                                   [class.fa-times]="column.officialScore === 0"
                                   class="fa text-white" style="font-size: 10px;"></i>
                              </div>
                              <div>
                                <div class="small fw-bold">{{ column.team.name }}</div>
                                <div class="very-small">
                                  <i *ngIf="column.officialScore > 0" class="fa fa-check text-success me-1"></i>
                                  <i *ngIf="column.officialScore === 0" class="fa fa-times text-danger me-1"></i>
                                  {{ column.officialScore > 0 ? 'Correct' : 'Wrong' }}
                                </div>
                              </div>
                            </div>
                            <div *ngIf="!column.team" class="small text-muted text-center">Empty</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Scored Bingo -->
                <div *ngIf="predictionType === 'Bingo' && prediction.scoredPostBingo">
                  <div class="bingo-grid-scored"
                       [style.grid-template-columns]="'repeat(' + prediction.scoredPostBingo.gridSize + ', 1fr)'"
                       [style.gap]="'4px'"
                       [style.display]="'grid'"
                       [style.max-width]="'300px'"
                       [style.margin]="'0 auto'">

                    <div *ngFor="let cell of getScoredBingoCells(prediction)"
                         class="bingo-cell-scored p-1 border text-center"
                         [class.border-success]="cell.officialScore > 0 && !cell.isWrong"
                         [class.bg-success]="cell.officialScore > 0 && !cell.isWrong"
                         [class.border-danger]="cell.isWrong"
                         [class.bg-danger]="cell.isWrong"
                         [class.border-secondary]="!cell.team"
                         [class.bg-secondary]="!cell.team"
                         style="min-height: 50px;">

                      <div *ngIf="cell.team">
                        <img *ngIf="cell.team.photoUrl" [src]="cell.team.photoUrl"
                             class="rounded mb-1" width="16" height="16" alt="Team">
                        <div class="very-small text-light fw-bold">
                          {{ cell.team.name | slice:0:6 }}{{ cell.team.name.length > 6 ? '...' : '' }}
                        </div>
                        <div class="very-small">
                          <i *ngIf="!cell.isWrong && cell.officialScore > 0" class="fa fa-check text-white"></i>
                          <i *ngIf="cell.isWrong" class="fa fa-times text-white"></i>
                        </div>
                      </div>
                      <div *ngIf="!cell.team" class="very-small text-muted">
                        <i class="fa fa-square-o"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Score Breakdown -->
                <div class="mt-2">
                  <div class="row text-center">
                    <div class="col-4">
                      <div class="small text-success">
                        <i class="fa fa-check-circle me-1"></i>
                        {{ prediction.correctCount }} Correct
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="small text-danger">
                        <i class="fa fa-times-circle me-1"></i>
                        {{ prediction.incorrectCount }} Wrong
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="small text-info">
                        <i class="fa fa-star me-1"></i>
                        {{ prediction.totalScore }} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Predictions Message -->
            <div *ngIf="results.scoredCounterPredictions.length === 0" class="text-center py-4">
              <i class="fa fa-info-circle fa-2x text-muted mb-2"></i>
              <p class="text-muted">No counter predictions to score yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading results...</p>
      </div>
    </div>
  `,
  styles: [`
    .rank-badge {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      position: relative;
    }

    .rank-first {
      background: linear-gradient(145deg, #ffd700, #ffed4e);
      color: #000;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .rank-second {
      background: linear-gradient(145deg, #c0c0c0, #e5e5e5);
      color: #000;
    }

    .rank-third {
      background: linear-gradient(145deg, #cd7f32, #daa520);
      color: #fff;
    }

    .rank-other {
      background: linear-gradient(145deg, #6c757d, #495057);
      color: #fff;
    }

    .rank-number {
      font-size: 1.2rem;
      line-height: 1;
    }

    .rank-icon {
      font-size: 0.7rem;
      margin-top: 2px;
    }

    .bingo-grid-official {
      max-width: 400px;
      margin: 0 auto;
    }

    .bingo-cell-official {
      min-height: 80px;
      border-radius: 8px;
    }

    .bingo-grid-scored {
      max-width: 300px;
      margin: 0 auto;
    }

    .bingo-cell-scored {
      min-height: 50px;
      border-radius: 4px;
    }

    .very-small {
      font-size: 0.65rem;
    }

    .table-responsive {
      border-radius: 8px;
      overflow: hidden;
    }

    .card {
      border-radius: 12px;
      overflow: hidden;
    }

    .bg-success {
      background-color: #28a745 !important;
    }

    .bg-danger {
      background-color: #dc3545 !important;
    }

    .border-success {
      border-color: #28a745 !important;
    }

    .border-danger {
      border-color: #dc3545 !important;
    }
  `]
})
export class PredictionResultsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  @Input() predictionId!: number;
  @Input() predictionType!: string;
  @Input() publishMode = false;
  @Input() originalTemplate: any;
  @Input() availableTeams: any[] = [];

  results: PredictionResults | null = null;
  isLoading = false;
  isPublishing = false;

  publishRequest: PublishResultsRequest = {
    predictionId: 0,
    predictionType: '',
    notes: '',
    resultsPostRank: null,
    resultsPostBracket: null,
    resultsPostBingo: null
  };

  ngOnInit(): void {
    if (this.predictionId) {
      this.publishRequest.predictionId = this.predictionId;
      this.publishRequest.predictionType = this.predictionType;

      if (!this.publishMode) {
        this.loadResults();
      } else {
        this.initializeResultsStructure();
      }
    }
  }

  private initializeResultsStructure(): void {
    if (this.predictionType === 'Ranking' && this.originalTemplate) {
      this.publishRequest.resultsPostRank = {
        id: 0,
        rankingTemplateId: this.originalTemplate.id,
        predictionId: this.predictionId,
        userId: this.accountService.currentUser()?.id || 0,
        rankTable: {
          id: 0,
          numberOfRows: this.originalTemplate.numberOfRows,
          numberOfColumns: this.originalTemplate.numberOfColumns,
          rows: []
        },
        isOfficialResult: true,
        totalScore: 0,
        rankTeams: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Initialize empty rank table
      for (let i = 0; i < this.originalTemplate.numberOfRows; i++) {
        const row = {
          id: 0,
          order: i + 1,
          columns: [],
          isWrong: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        for (let j = 0; j < this.originalTemplate.numberOfColumns; j++) {
          row.columns.push({
            id: 0,
            team: null,
            officialScore: 0,
            order: j + 1
          });
        }

        this.publishRequest.resultsPostRank.rankTable.rows.push(row);
      }
    } else if (this.predictionType === 'Bingo' && this.originalTemplate) {
      this.publishRequest.resultsPostBingo = {
        id: 0,
        userId: this.accountService.currentUser()?.id || 0,
        gridSize: this.originalTemplate.gridSize,
        bingoCells: [],
        teams: [],
        totalScore: 0,
        isOfficialResult: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Initialize empty bingo cells
      for (let row = 0; row < this.originalTemplate.gridSize; row++) {
        for (let col = 0; col < this.originalTemplate.gridSize; col++) {
          this.publishRequest.resultsPostBingo.bingoCells.push({
            id: 0,
            score: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            bingoId: 0,
            row: row,
            column: col,
            team: null,
            officialScore: 0,
            isWrong: false
          });
        }
      }
    }
  }

  async loadResults(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.http.get<PredictionResults>(
        `${environment.apiUrl}post/${this.predictionId}/results`
      ).toPromise();

      if (response) {
        this.results = response;
        console.log('Loaded prediction results:', this.results);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      this.toastr.error('Failed to load prediction results');
    } finally {
      this.isLoading = false;
    }
  }

  async publishResults(): Promise<void> {
    if (!this.canPublish()) {
      this.toastr.warning('Please complete the results before publishing');
      return;
    }

    if (!confirm('Are you sure you want to publish these results? This will score all counter predictions and cannot be undone.')) {
      return;
    }

    this.isPublishing = true;
    try {
      await this.http.post(
        `${environment.apiUrl}post/publish-results`,
        this.publishRequest
      ).toPromise();

      this.toastr.success('Results published successfully! All counter predictions have been scored.');
      this.publishMode = false;
      await this.loadResults();
    } catch (error) {
      console.error('Error publishing results:', error);
      this.toastr.error('Failed to publish results');
    } finally {
      this.isPublishing = false;
    }
  }

  async recalculateScores(): Promise<void> {
    if (!confirm('Are you sure you want to recalculate all scores? This may take a moment.')) {
      return;
    }

    try {
      await this.http.post(
        `${environment.apiUrl}post/${this.predictionId}/calculate-scores`,
        {}
      ).toPromise();

      this.toastr.success('Scores recalculated successfully!');
      await this.loadResults();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      this.toastr.error('Failed to recalculate scores');
    }
  }

  canPublish(): boolean {
    if (this.predictionType === 'Ranking') {
      return this.publishRequest.resultsPostRank?.rankTable?.rows?.some((row: any) =>
        row.columns?.some((col: any) => col.team)
      ) || false;
    } else if (this.predictionType === 'Bingo') {
      return this.publishRequest.resultsPostBingo?.bingoCells?.some((cell: any) => cell.team) || false;
    }
    return false;
  }

  canRecalculateScores(): boolean {
    const currentUser = this.accountService.currentUser();
    return currentUser && this.results?.author?.id === currentUser.id;
  }

  cancelPublish(): void {
    this.publishMode = false;
  }

  // Helper methods for displaying official results
  getOfficialRankingRows(): any[] {
    return this.results?.officialResults?.rankTable?.rows || [];
  }

  getOfficialRankingFirstRow(): any[] {
    const rows = this.getOfficialRankingRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getOfficialBingoCells(): any[] {
    return this.results?.officialBingoResults?.bingoCells || [];
  }

  // Helper methods for displaying scored counter predictions
  getScoredRankingRows(prediction: ScoredCounterPrediction): any[] {
    return prediction.scoredPostRank?.rankTable?.rows || [];
  }

  getScoredRankingFirstRow(prediction: ScoredCounterPrediction): any[] {
    const rows = this.getScoredRankingRows(prediction);
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getScoredBingoCells(prediction: ScoredCounterPrediction): any[] {
    return prediction.scoredPostBingo?.bingoCells || [];
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Unknown';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  }
}
