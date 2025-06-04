// client/src/app/prediction-results-display/prediction-results-display.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { PredictionResultsService, PredictionResults, ScoredCounterPrediction } from '../_services/prediction-results.service';

@Component({
  selector: 'app-prediction-results-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4" *ngIf="results">
      <!-- Header -->
      <div class="card bg-success border-success mb-4">
        <div class="card-header bg-success border-success">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-trophy me-2"></i>Official Results Published
              </h2>
              <p class="text-light mb-0 opacity-75">
                Results for "{{ results.title }}" - Published {{ formatDate(results.resultsPublishedAt) }}
              </p>
            </div>
            <div class="d-flex gap-2">
              <button *ngIf="canRecalculateScores()"
                      class="btn btn-outline-light"
                      (click)="recalculateScores()"
                      [disabled]="isRecalculating">
                <i class="fa fa-refresh me-1" [class.fa-spin]="isRecalculating"></i>
                {{ isRecalculating ? 'Recalculating...' : 'Recalculate Scores' }}
              </button>
              <button class="btn btn-outline-light" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Notes -->
      <div *ngIf="results.resultsNotes" class="card bg-info border-info mb-4">
        <div class="card-body">
          <h6 class="text-light">
            <i class="fa fa-sticky-note me-2"></i>Results Notes
          </h6>
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
              <div class="h4 text-info">{{ formatPercentage(results.stats.averageAccuracy) }}%</div>
              <div class="small text-muted">Average Accuracy</div>
            </div>
            <div class="col-md-2 mb-3">
              <div class="h4 text-warning">{{ formatPercentage(results.stats.highestAccuracy) }}%</div>
              <div class="small text-muted">Best Score</div>
            </div>
            <div class="col-md-2 mb-3">
              <div class="h4 text-secondary">{{ formatPercentage(results.stats.lowestAccuracy) }}%</div>
              <div class="small text-muted">Lowest Score</div>
            </div>
            <div class="col-md-2 mb-3" *ngIf="results.stats.bestPrediction">
              <div class="h6 text-warning">{{ results.stats.bestPrediction.author.displayName }}</div>
              <div class="small text-muted">Top Performer</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <!-- Official Results Display -->
          <div class="card bg-secondary border-secondary mb-4">
            <div class="card-header bg-secondary border-secondary">
              <h5 class="text-light mb-0">
                <i class="fa fa-trophy me-2 text-warning"></i>Official {{ results.predictionType }} Results
              </h5>
            </div>
            <div class="card-body">
              <!-- Official Ranking Display -->
              <div *ngIf="results.predictionType === 'Ranking' && results.officialResults">
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <thead>
                      <tr class="table-warning">
                        <th class="text-dark">Rank</th>
                        <th *ngFor="let col of getOfficialRankingFirstRow(); let i = index" class="text-dark">
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
              <div *ngIf="results.predictionType === 'Bingo' && results.officialBingoResults">
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
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="text-light mb-0">
                  <i class="fa fa-list-ol me-2"></i>Leaderboard - Counter Predictions Scored
                </h5>
                <div class="d-flex align-items-center gap-2">
                  <small class="text-muted">Sort by:</small>
                  <select class="form-select form-select-sm bg-secondary text-light border-secondary"
                          [(ngModel)]="sortBy"
                          (change)="sortLeaderboard()">
                    <option value="rank">Rank (Best First)</option>
                    <option value="accuracy">Accuracy %</option>
                    <option value="score">Total Score</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="date">Date Submitted</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div *ngFor="let prediction of sortedPredictions; let i = index"
                   class="card border-primary mb-3 prediction-card"
                   [class.border-warning]="prediction.rank === 1"
                   [class.bg-warning]="prediction.rank === 1"
                   [class.border-info]="prediction.rank === 2"
                   [class.bg-info]="prediction.rank === 2"
                   [class.border-success]="prediction.rank === 3"
                   [class.bg-success]="prediction.rank === 3"
                   [class.bg-secondary]="prediction.rank > 3">

                <!-- Prediction Header -->
                <div class="card-header"
                     [class.bg-warning]="prediction.rank === 1"
                     [class.bg-info]="prediction.rank === 2"
                     [class.bg-success]="prediction.rank === 3"
                     [class.bg-secondary]="prediction.rank > 3"
                     [class.border-warning]="prediction.rank === 1"
                     [class.border-info]="prediction.rank === 2"
                     [class.border-success]="prediction.rank === 3"
                     [class.border-primary]="prediction.rank > 3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                      <!-- Rank Badge -->
                      <div class="rank-badge me-3" [class]="getRankBadgeClass(prediction.rank)">
                        <span class="rank-number">{{ prediction.rank }}</span>
                        <i *ngIf="prediction.rank === 1" class="fa fa-crown rank-icon"></i>
                        <i *ngIf="prediction.rank === 2" class="fa fa-medal rank-icon"></i>
                        <i *ngIf="prediction.rank === 3" class="fa fa-trophy rank-icon"></i>
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
                          <h6 class="mb-0" [class]="getTextColorClass(prediction.rank)">
                            {{ prediction.author.displayName }}
                          </h6>
                          <small [class]="getSubTextColorClass(prediction.rank)">
                            Submitted {{ formatDate(prediction.createdAt) }}
                          </small>
                        </div>
                      </div>
                    </div>

                    <!-- Score Info -->
                    <div class="text-end">
                      <div class="h5 mb-0" [class]="getTextColorClass(prediction.rank)">
                        {{ formatPercentage(prediction.accuracyPercentage) }}%
                      </div>
                      <small [class]="getSubTextColorClass(prediction.rank)">
                        {{ prediction.correctCount }}/{{ prediction.correctCount + prediction.incorrectCount }} correct
                      </small>
                      <div class="small" [class]="getSubTextColorClass(prediction.rank)">
                        {{ prediction.totalScore }} points
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Scored Prediction Display -->
                <div class="card-body">
                  <!-- Scored Ranking -->
                  <div *ngIf="results.predictionType === 'Ranking' && prediction.scoredPostRank">
                    <div class="table-responsive">
                      <table class="table table-sm"
                             [class.table-dark]="prediction.rank > 1"
                             [class.table-light]="prediction.rank === 1">
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
                                [class.bg-danger]="column.officialScore === 0 && column.team"
                                [class.bg-secondary]="!column.team">
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
                                    <span class="text-muted">({{ column.officialScore }} pts)</span>
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
                  <div *ngIf="results.predictionType === 'Bingo' && prediction.scoredPostBingo">
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
                            <span class="text-muted">({{ cell.officialScore }})</span>
                          </div>
                        </div>
                        <div *ngIf="!cell.team" class="very-small text-muted">
                          <i class="fa fa-square-o"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Score Breakdown -->
                  <div class="mt-3">
                    <div class="row text-center">
                      <div class="col-3">
                        <div class="small text-success">
                          <i class="fa fa-check-circle me-1"></i>
                          <strong>{{ prediction.correctCount }}</strong> Correct
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="small text-danger">
                          <i class="fa fa-times-circle me-1"></i>
                          <strong>{{ prediction.incorrectCount }}</strong> Wrong
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="small text-info">
                          <i class="fa fa-star me-1"></i>
                          <strong>{{ prediction.totalScore }}</strong> pts
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="small text-warning">
                          <i class="fa fa-trophy me-1"></i>
                          <strong>{{ formatPercentage(prediction.accuracyPercentage) }}%</strong>
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

        <!-- Sidebar with Additional Stats -->
        <div class="col-lg-4">
          <!-- Team Performance Stats -->
          <div class="card bg-dark border-dark mb-3" *ngIf="results.stats.teamAccuracyStats.length > 0">
            <div class="card-header bg-dark border-dark">
              <h6 class="text-light mb-0">
                <i class="fa fa-users me-2"></i>Team Performance
              </h6>
            </div>
            <div class="card-body">
              <div *ngFor="let teamStat of results.stats.teamAccuracyStats.slice(0, 10)"
                   class="d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary rounded">
                <div>
                  <div class="small fw-bold text-light">{{ teamStat.teamName }}</div>
                  <div class="very-small text-muted">
                    {{ teamStat.correctPredictions }}/{{ teamStat.totalPredictions }} predictions
                  </div>
                </div>
                <div class="text-end">
                  <span class="badge bg-info">{{ formatPercentage(teamStat.accuracyPercentage) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h6 class="text-light mb-0">
                <i class="fa fa-chart-pie me-2"></i>Quick Stats
              </h6>
            </div>
            <div class="card-body">
              <div class="row text-center">
                <div class="col-6 mb-3">
                  <div class="h6 text-success">{{ getCorrectPredictionsCount() }}</div>
                  <div class="very-small text-muted">Total Correct</div>
                </div>
                <div class="col-6 mb-3">
                  <div class="h6 text-danger">{{ getIncorrectPredictionsCount() }}</div>
                  <div class="very-small text-muted">Total Wrong</div>
                </div>
                <div class="col-6">
                  <div class="h6 text-info">{{ getTotalPointsAwarded() }}</div>
                  <div class="very-small text-muted">Points Awarded</div>
                </div>
                <div class="col-6">
                  <div class="h6 text-warning">{{ formatPercentage(getOverallAccuracy()) }}%</div>
                  <div class="very-small text-muted">Overall Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Export Results -->
          <div class="card bg-dark border-dark">
            <div class="card-header bg-dark border-dark">
              <h6 class="text-light mb-0">
                <i class="fa fa-download me-2"></i>Export Results
              </h6>
            </div>
            <div class="card-body">
              <button class="btn btn-outline-primary btn-sm w-100 mb-2" (click)="exportResults('csv')">
                <i class="fa fa-file-excel-o me-1"></i>Export to CSV
              </button>
              <button class="btn btn-outline-secondary btn-sm w-100" (click)="shareResults()">
                <i class="fa fa-share me-1"></i>Share Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!results && isLoading" class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading results...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!results && !isLoading" class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-warning">Results Not Found</h5>
      <p class="text-muted">
        The results for this prediction are not available or haven't been published yet.
      </p>
      <button class="btn btn-primary" (click)="goBack()">Go Back</button>
    </div>
  `,
  styles: [`
    .prediction-card {
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease;
    }

    .prediction-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

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
      background: linear-gradient(145deg, #17a2b8, #20c997);
      color: #fff;
      box-shadow: 0 4px 15px rgba(23, 162, 184, 0.4);
    }

    .rank-third {
      background: linear-gradient(145deg, #28a745, #20c997);
      color: #fff;
      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
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

    .bingo-grid-official, .bingo-grid-scored {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 12px;
    }

    .bingo-cell-official {
      min-height: 80px;
      border-radius: 8px;
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

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .table-warning th {
      background-color: #ffc107 !important;
      color: #000 !important;
    }
  `]
})
export class PredictionResultsDisplayComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);
  private resultsService = inject(PredictionResultsService);

  results: PredictionResults | null = null;
  sortedPredictions: ScoredCounterPrediction[] = [];
  isLoading = false;
  isRecalculating = false;
  sortBy = 'rank';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.loadResults(predictionId);
      }
    });
  }

  async loadResults(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.resultsService.getPredictionResults(predictionId).toPromise();
      this.results = response || null;
      if (this.results) {
        this.sortedPredictions = [...this.results.scoredCounterPredictions];
        this.sortLeaderboard();
      }
    } catch (error) {
      console.error('Error loading results:', error);
      this.toastr.error('Failed to load prediction results');
      this.results = null;
    } finally {
      this.isLoading = false;
    }
  }

  async recalculateScores(): Promise<void> {
    if (!this.results || !confirm('Are you sure you want to recalculate all scores? This may take a moment.')) {
      return;
    }

    this.isRecalculating = true;
    try {
      await this.resultsService.recalculateScores(this.results.predictionId).toPromise();
      this.toastr.success('Scores recalculated successfully!');
      await this.loadResults(this.results.predictionId);
    } catch (error) {
      console.error('Error recalculating scores:', error);
      this.toastr.error('Failed to recalculate scores');
    } finally {
      this.isRecalculating = false;
    }
  }

  sortLeaderboard(): void {
    if (!this.results) return;

    switch (this.sortBy) {
      case 'accuracy':
        this.sortedPredictions.sort((a, b) => b.accuracyPercentage - a.accuracyPercentage);
        break;
      case 'score':
        this.sortedPredictions.sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'name':
        this.sortedPredictions.sort((a, b) => a.author.displayName.localeCompare(b.author.displayName));
        break;
      case 'date':
        this.sortedPredictions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rank':
      default:
        this.sortedPredictions.sort((a, b) => a.rank - b.rank);
        break;
    }
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

  // Styling helper methods
  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    return 'rank-other';
  }

  getTextColorClass(rank: number): string {
    if (rank === 1) return 'text-dark';
    return 'text-light';
  }

  getSubTextColorClass(rank: number): string {
    if (rank === 1) return 'text-dark opacity-75';
    return 'text-muted';
  }

  // Statistics calculation methods
  getCorrectPredictionsCount(): number {
    return this.results?.scoredCounterPredictions.reduce((sum, p) => sum + p.correctCount, 0) || 0;
  }

  getIncorrectPredictionsCount(): number {
    return this.results?.scoredCounterPredictions.reduce((sum, p) => sum + p.incorrectCount, 0) || 0;
  }

  getTotalPointsAwarded(): number {
    return this.results?.scoredCounterPredictions.reduce((sum, p) => sum + p.totalScore, 0) || 0;
  }

  getOverallAccuracy(): number {
    const total = this.getCorrectPredictionsCount() + this.getIncorrectPredictionsCount();
    return total > 0 ? (this.getCorrectPredictionsCount() / total) * 100 : 0;
  }

  // Permission check
  canRecalculateScores(): boolean {
    const currentUser = this.accountService.currentUser();
    return this.results?.author?.id
  }

  // Export functionality
  exportResults(format: string): void {
    if (!this.results) return;

    if (format === 'csv') {
      this.exportToCSV();
    }
  }

  private exportToCSV(): void {
    if (!this.results) return;

    const headers = ['Rank', 'Player', 'Accuracy %', 'Correct', 'Incorrect', 'Total Score', 'Date Submitted'];
    const csvContent = [
      headers.join(','),
      ...this.results.scoredCounterPredictions.map(p => [
        p.rank,
        `"${p.author.displayName}"`,
        this.formatPercentage(p.accuracyPercentage),
        p.correctCount,
        p.incorrectCount,
        p.totalScore,
        `"${this.formatDate(p.createdAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.results.title}_results.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastr.success('Results exported to CSV successfully!');
  }

  shareResults(): void {
    if (!this.results) return;

    const url = window.location.href;
    const text = `Check out the results for "${this.results.title}"! ${this.results.stats.totalCounterPredictions} predictions scored.`;

    if (navigator.share) {
      navigator.share({
        title: `Results: ${this.results.title}`,
        text: text,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Results link copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy link');
      });
    }
  }

  // Utility methods
  formatDate(date: string | Date): string {
    if (!date) return 'Unknown';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  }

  formatPercentage(value: number): string {
    return value.toFixed(1);
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
