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

interface CounterPredictionData {
  id: number;
  author: any;
  createdAt: Date;
  totalScore?: number;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
  userId: number;
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
              <h6 class="text-light">Counter Predictions Count:</h6>
              <pre class="text-light small">
Total Counter Predictions: {{ getAllCounterPredictions().length }}
Ranking Counter Predictions: {{ getCounterRankings().length }}
Bingo Counter Predictions: {{ getCounterBingos().length }}
Original Post Data Available: {{ hasOriginalPostData() }}
Available Teams: {{ getAvailableTeams().length }}
              </pre>
            </div>
            <div class="col-md-6">
              <h6 class="text-light">Raw Post Data:</h6>
              <pre class="text-light small" style="max-height: 200px; overflow-y: auto;">
PostRanks: {{ predictionDetail.postRanks?.length || 0 }}
PostBingos: {{ predictionDetail.postBingos?.length || 0 }}
{{ getDebugStructure() }}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row mb-4">
        <div class="col-lg-8">
          <!-- Original Prediction Section -->
          <div class="mb-4">
            <h3 class="text-light mb-3">
              <i class="fa fa-star me-2 text-warning"></i>Original Prediction
              <small class="text-muted ms-2">by {{ predictionDetail.author?.displayName || 'Unknown' }}</small>
            </h3>

            <!-- Original Ranking Prediction -->
            <div *ngIf="isRankingType() && hasOriginalRankingData()"
                 class="card bg-secondary border-secondary mb-4">
              <div class="card-header bg-secondary border-secondary">
                <h4 class="text-light mb-0">
                  <i class="fa fa-list-ol me-2"></i>Ranking Prediction
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
                          <div *ngIf="column.team" class="d-flex align-items-center p-2">
                            <img *ngIf="column.team.photoUrl && column.team.photoUrl.trim()"
                                 [src]="column.team.photoUrl"
                                 class="rounded me-2"
                                 width="32" height="32"
                                 alt="Team"
                                 (error)="onImageError($event)">
                            <div class="bg-warning rounded-circle me-2 d-flex align-items-center justify-content-center"
                                 *ngIf="!column.team.photoUrl || !column.team.photoUrl.trim()"
                                 style="width: 32px; height: 32px; min-width: 32px;">
                              <i class="fa fa-users text-dark small"></i>
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
              </div>
            </div>

            <!-- Original Bingo Prediction -->
            <div *ngIf="isBingoType() && hasOriginalBingoData()"
                 class="card bg-secondary border-secondary mb-4">
              <div class="card-header bg-secondary border-secondary">
                <h4 class="text-light mb-0">
                  <i class="fa fa-th me-2"></i>Bingo Prediction
                </h4>
                <div class="small text-light opacity-75">
                  Grid Size: {{ getOriginalBingoData()?.gridSize }}x{{ getOriginalBingoData()?.gridSize }} |
                  Total Score: {{ getOriginalBingoData()?.totalScore || 0 }} |
                  Created: {{ formatDate(getOriginalBingoData()?.createdAt) }}
                </div>
              </div>
              <div class="card-body">
                <div class="bingo-grid"
                     [style.grid-template-columns]="'repeat(' + getOriginalBingoData()?.gridSize + ', 1fr)'"
                     [style.gap]="'8px'"
                     [style.display]="'grid'">

                  <div *ngFor="let cell of getOriginalBingoCells(); let cellIndex = index"
                       class="bingo-cell p-2 border text-center original-cell"
                       [class.has-team]="cell.team"
                       [class.empty-cell]="!cell.team">

                    <div *ngIf="cell.team">
                      <img *ngIf="cell.team.photoUrl && cell.team.photoUrl.trim()"
                           [src]="cell.team.photoUrl"
                           class="rounded mb-1"
                           width="24" height="24"
                           alt="Team"
                           (error)="onImageError($event)">
                      <div class="bg-warning rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                           *ngIf="!cell.team.photoUrl || !cell.team.photoUrl.trim()"
                           style="width: 24px; height: 24px;">
                        <i class="fa fa-users text-dark" style="font-size: 10px;"></i>
                      </div>
                      <div class="small text-light fw-bold">{{ cell.team.name }}</div>
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
              </div>
            </div>
          </div>

          <!-- Counter Predictions Section -->
          <div class="mb-4" *ngIf="getAllCounterPredictions().length > 0">
            <h3 class="text-light mb-3" id="counter-predictions">
              <i class="fa fa-users me-2 text-info"></i>Counter Predictions
              <small class="text-muted ms-2">({{ getAllCounterPredictions().length }} responses)</small>
            </h3>

            <!-- Counter Ranking Predictions -->
            <div *ngIf="isRankingType() && getCounterRankings().length > 0">
              <div *ngFor="let counterPrediction of getCounterRankings(); let i = index"
                   class="card bg-dark border-primary mb-3 counter-prediction-card fade-in-up">
                <div class="card-header bg-dark border-primary">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                      <img *ngIf="counterPrediction.author?.photoUrl"
                           [src]="counterPrediction.author.photoUrl"
                           class="rounded-circle me-2" width="32" height="32" alt="Author">
                      <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                           *ngIf="!counterPrediction.author?.photoUrl"
                           style="width: 32px; height: 32px;">
                        <i class="fa fa-user text-white"></i>
                      </div>
                      <div>
                        <h6 class="text-light mb-0">{{ counterPrediction.author?.displayName || 'Anonymous' }}</h6>
                        <small class="text-muted">{{ formatDate(counterPrediction.createdAt) }}</small>
                      </div>
                    </div>
                    <div class="text-end">
                      <span class="badge bg-primary">Counter Prediction #{{ i + 1 }}</span>
                      <div class="small text-muted mt-1">Score: {{ counterPrediction.totalScore || 0 }}</div>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped table-sm">
                      <thead>
                        <tr>
                          <th width="60">Rank</th>
                          <th *ngFor="let col of getCounterRankingFirstRowColumns(counterPrediction); let j = index">
                            Pos {{ j + 1 }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of getCounterRankingRows(counterPrediction); let rowIndex = index">
                          <td class="fw-bold text-primary">#{{ row.order }}</td>
                          <td *ngFor="let column of row.columns || []">
                            <div *ngIf="column.team" class="d-flex align-items-center p-1">
                              <img *ngIf="column.team.photoUrl && column.team.photoUrl.trim()"
                                   [src]="column.team.photoUrl"
                                   class="rounded me-1"
                                   width="24" height="24"
                                   alt="Team"
                                   (error)="onImageError($event)">
                              <div class="bg-primary rounded-circle me-1 d-flex align-items-center justify-content-center"
                                   *ngIf="!column.team.photoUrl || !column.team.photoUrl.trim()"
                                   style="width: 24px; height: 24px; min-width: 24px;">
                                <i class="fa fa-users text-white" style="font-size: 10px;"></i>
                              </div>
                              <div>
                                <div class="fw-bold text-light small">{{ column.team.name }}</div>
                                <div class="very-small text-muted" *ngIf="column.team.description && column.team.description.trim()">
                                  {{ column.team.description | slice:0:30 }}{{ column.team.description.length > 30 ? '...' : '' }}
                                </div>
                              </div>
                            </div>
                            <div *ngIf="!column.team" class="text-muted small text-center py-1">
                              <i class="fa fa-minus"></i>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Counter prediction stats -->
                  <div class="row mt-2">
                    <div class="col-6">
                      <small class="text-muted">Teams Assigned: {{ getCounterRankingAssignedCount(counterPrediction) }}</small>
                    </div>
                    <div class="col-6 text-end">
                      <small class="text-muted">Completion: {{ getCounterRankingCompletionPercentage(counterPrediction) }}%</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Counter Bingo Predictions -->
            <div *ngIf="isBingoType() && getCounterBingos().length > 0">
              <div *ngFor="let counterPrediction of getCounterBingos(); let i = index"
                   class="card bg-dark border-primary mb-3 counter-prediction-card fade-in-up">
                <div class="card-header bg-dark border-primary">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                      <img *ngIf="counterPrediction.author?.photoUrl"
                           [src]="counterPrediction.author.photoUrl"
                           class="rounded-circle me-2" width="32" height="32" alt="Author">
                      <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                           *ngIf="!counterPrediction.author?.photoUrl"
                           style="width: 32px; height: 32px;">
                        <i class="fa fa-user text-white"></i>
                      </div>
                      <div>
                        <h6 class="text-light mb-0">{{ counterPrediction.author?.displayName || 'Anonymous' }}</h6>
                        <small class="text-muted">{{ formatDate(counterPrediction.createdAt) }}</small>
                      </div>
                    </div>
                    <div class="text-end">
                      <span class="badge bg-primary">Counter Bingo #{{ i + 1 }}</span>
                      <div class="small text-muted mt-1">Score: {{ counterPrediction.totalScore || 0 }}</div>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="bingo-grid"
                       [style.grid-template-columns]="'repeat(' + getCounterBingoGridSize(counterPrediction) + ', 1fr)'"
                       [style.gap]="'4px'"
                       [style.display]="'grid'"
                       [style.max-width]="'300px'"
                       [style.margin]="'0 auto'">

                    <div *ngFor="let cell of getCounterBingoCells(counterPrediction); let cellIndex = index"
                         class="bingo-cell p-1 border text-center counter-cell"
                         [class.has-team]="cell.team"
                         [class.empty-cell]="!cell.team"
                         style="min-height: 60px;">

                      <div *ngIf="cell.team">
                        <img *ngIf="cell.team.photoUrl && cell.team.photoUrl.trim()"
                             [src]="cell.team.photoUrl"
                             class="rounded mb-1"
                             width="20" height="20"
                             alt="Team"
                             (error)="onImageError($event)">
                        <div class="bg-primary rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                             *ngIf="!cell.team.photoUrl || !cell.team.photoUrl.trim()"
                             style="width: 20px; height: 20px;">
                          <i class="fa fa-users text-white" style="font-size: 8px;"></i>
                        </div>
                        <div class="very-small text-light fw-bold">{{ cell.team.name | slice:0:8 }}{{ cell.team.name.length > 8 ? '...' : '' }}</div>
                      </div>
                      <div *ngIf="!cell.team" class="text-muted very-small">
                        <i class="fa fa-square-o"></i>
                      </div>
                    </div>
                  </div>

                  <!-- Counter bingo stats -->
                  <div class="row mt-2">
                    <div class="col-6">
                      <small class="text-muted">Teams Assigned: {{ getCounterBingoAssignedCount(counterPrediction) }}</small>
                    </div>
                    <div class="col-6 text-end">
                      <small class="text-muted">Completion: {{ getCounterBingoCompletionPercentage(counterPrediction) }}%</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Counter Predictions Message -->
          <div class="mb-4" *ngIf="hasOriginalPostData() && getAllCounterPredictions().length === 0">
            <div class="card bg-info border-info">
              <div class="card-body text-center">
                <i class="fa fa-users fa-2x text-white mb-3"></i>
                <h5 class="text-white">No Counter Predictions Yet</h5>
                <p class="text-white mb-2">Be the first to create a counter prediction for this {{ getPredictionTypeDisplayName().toLowerCase() }}!</p>
                <button *ngIf="canShowCounterPrediction()"
                        class="btn btn-light"
                        (click)="scrollToCounterPrediction()">
                  <i class="fa fa-plus me-2"></i>Create Counter Prediction
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
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
                  <strong>Created:</strong> {{ formatDate(predictionDetail.createdAt) }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light" *ngIf="predictionDetail.endDate">
                  <strong>Ends:</strong> {{ formatDate(predictionDetail.endDate) }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Status:</strong>
                  <span [class]="predictionDetail.isActive ? 'text-success' : 'text-warning'">
                    {{ predictionDetail.isActive ? 'Active' : 'Ended' }}
                  </span>
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Counter Predictions:</strong>
                  <span class="badge bg-info ms-2">{{ getAllCounterPredictions().length }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Counter Predictions Summary -->
          <div class="card bg-dark border-dark mb-3" *ngIf="getAllCounterPredictions().length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">
                <i class="fa fa-chart-bar me-2"></i>Response Summary
              </h5>
            </div>
            <div class="card-body">
              <div class="row text-center">
                <div class="col-6">
                  <div class="h4 text-primary">{{ getAllCounterPredictions().length }}</div>
                  <div class="small text-muted">Total Responses</div>
                </div>
                <div class="col-6">
                  <div class="h4 text-success">{{ getUniqueRespondersCount() }}</div>
                  <div class="small text-muted">Unique Users</div>
                </div>
              </div>

              <hr class="border-secondary">

              <div class="list-group list-group-flush">
                <div *ngFor="let counter of getAllCounterPredictions().slice(0, 3)"
                     class="list-group-item bg-transparent border-secondary text-light p-2">
                  <div class="d-flex align-items-center">
                    <img *ngIf="counter.author?.photoUrl"
                         [src]="counter.author.photoUrl"
                         class="rounded-circle me-2" width="24" height="24" alt="Author">
                    <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                         *ngIf="!counter.author?.photoUrl"
                         style="width: 24px; height: 24px;">
                      <i class="fa fa-user text-white" style="font-size: 10px;"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="small fw-bold">{{ counter.author?.displayName || 'Anonymous' }}</div>
                      <div class="very-small text-muted">{{ formatDateShort(counter.createdAt) }}</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="getAllCounterPredictions().length > 3"
                     class="text-center py-2">
                  <small class="text-muted">+{{ getAllCounterPredictions().length - 3 }} more</small>
                </div>
              </div>

              <button class="btn btn-outline-primary btn-sm w-100 mt-2"
                      (click)="scrollToCounterPredictions()">
                <i class="fa fa-eye me-1"></i>View All Responses
              </button>
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
                      <div class="very-small text-muted" *ngIf="team.description">{{ team.description | slice:0:20 }}{{ team.description.length > 20 ? '...' : '' }}</div>
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

    .original-cell.has-team {
      background-color: #ffc107;
      border-color: #e0a800;
    }

    .counter-cell.has-team {
      background-color: #007bff;
      border-color: #0056b3;
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

    .table-sm td {
      padding: 0.25rem;
    }

    .counter-prediction-card {
      transition: all 0.2s ease;
    }

    .counter-prediction-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
    }

    .fade-in-up {
      animation: fadeInUp 0.5s ease-out;
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

    .scroll-target {
      scroll-margin-top: 100px;
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

    // Check for action parameter to auto-show counter prediction
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'counter-predict') {
        setTimeout(() => {
          this.autoShowCounterPrediction();
        }, 1000);
      }
    });

    // Check for fragment to scroll to responses
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'responses' || fragment === 'counter-predictions') {
        setTimeout(() => {
          this.scrollToCounterPredictions();
        }, 1000);
      }
    });
  }

  async loadPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      console.log('=== Loading Prediction Details with Counter Predictions ===');
      console.log('Prediction ID:', predictionId);

      const response = await this.http.get<PredictionDetail>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      if (response) {
        this.predictionDetail = response;
        console.log('Loaded prediction detail:', this.predictionDetail);
        console.log('PostRanks count:', this.predictionDetail.postRanks?.length || 0);
        console.log('PostBingos count:', this.predictionDetail.postBingos?.length || 0);

        // Log counter predictions
        const counterRankings = this.getCounterRankings();
        const counterBingos = this.getCounterBingos();
        console.log('Counter Rankings:', counterRankings.length);
        console.log('Counter Bingos:', counterBingos.length);

        if (counterRankings.length > 0) {
          console.log('First counter ranking:', counterRankings[0]);
        }
        if (counterBingos.length > 0) {
          console.log('First counter bingo:', counterBingos[0]);
        }
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
      return false;
    }

    // Don't show for own predictions
    if (this.predictionDetail.userId === currentUser.id) {
      return false;
    }

    // Don't show for draft predictions
    if (this.predictionDetail.isDraft) {
      return false;
    }

    // Only show for active predictions
    if (!this.predictionDetail.isActive) {
      return false;
    }

    // Only show if we have original post data and teams
    const hasPostData = this.hasOriginalPostData();
    const availableTeams = this.getAvailableTeams();
    const hasTeams = availableTeams.length > 0;

    // Check if user already has a counter prediction
    const hasExistingCounter = this.userHasCounterPrediction(currentUser.id);

    return hasPostData && hasTeams && !hasExistingCounter;
  }

  userHasCounterPrediction(userId: number): boolean {
    const allCounters = this.getAllCounterPredictions();
    return allCounters.some(counter => counter.userId === userId);
  }

  getAllCounterPredictions(): CounterPredictionData[] {
    const counters: CounterPredictionData[] = [];

    // Get counter rankings (exclude original by author)
    if (this.predictionDetail?.postRanks) {
      this.predictionDetail.postRanks.forEach(postRank => {
        if (postRank.userId !== this.predictionDetail?.userId) {
          counters.push({
            id: postRank.id,
            author: postRank.user,
            createdAt: new Date(postRank.createdAt),
            totalScore: postRank.totalScore,
            postRank: postRank,
            userId: postRank.userId
          });
        }
      });
    }

    // Get counter bingos (exclude original by author)
    if (this.predictionDetail?.postBingos) {
      this.predictionDetail.postBingos.forEach(postBingo => {
        if (postBingo.userId !== this.predictionDetail?.userId) {
          counters.push({
            id: postBingo.id,
            author: postBingo.user,
            createdAt: new Date(postBingo.createdAt),
            totalScore: postBingo.totalScore,
            postBingo: postBingo,
            userId: postBingo.userId
          });
        }
      });
    }

    // Sort by creation date (newest first)
    return counters.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getCounterRankings(): CounterPredictionData[] {
    if (!this.isRankingType()) return [];
    return this.getAllCounterPredictions().filter(counter => counter.postRank);
  }

  getCounterBingos(): CounterPredictionData[] {
    if (!this.isBingoType()) return [];
    return this.getAllCounterPredictions().filter(counter => counter.postBingo);
  }

  getUniqueRespondersCount(): number {
    const userIds = new Set(this.getAllCounterPredictions().map(counter => counter.userId));
    return userIds.size;
  }

  // COUNTER RANKING HELPER METHODS
  getCounterRankingRows(counterPrediction: CounterPredictionData): any[] {
    return counterPrediction.postRank?.rankTable?.rows || [];
  }

  getCounterRankingFirstRowColumns(counterPrediction: CounterPredictionData): any[] {
    const rows = this.getCounterRankingRows(counterPrediction);
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getCounterRankingAssignedCount(counterPrediction: CounterPredictionData): number {
    const rows = this.getCounterRankingRows(counterPrediction);
    let count = 0;
    rows.forEach(row => {
      row.columns?.forEach((col: any) => {
        if (col.team) count++;
      });
    });
    return count;
  }

  getCounterRankingTotalSlots(counterPrediction: CounterPredictionData): number {
    const rankTable = counterPrediction.postRank?.rankTable;
    if (!rankTable) return 0;
    return (rankTable.numberOfRows || 0) * (rankTable.numberOfColumns || 0);
  }

  getCounterRankingCompletionPercentage(counterPrediction: CounterPredictionData): number {
    const assigned = this.getCounterRankingAssignedCount(counterPrediction);
    const total = this.getCounterRankingTotalSlots(counterPrediction);
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  }

  // COUNTER BINGO HELPER METHODS
  getCounterBingoCells(counterPrediction: CounterPredictionData): any[] {
    return counterPrediction.postBingo?.bingoCells || [];
  }

  getCounterBingoGridSize(counterPrediction: CounterPredictionData): number {
    return counterPrediction.postBingo?.gridSize || 5;
  }

  getCounterBingoAssignedCount(counterPrediction: CounterPredictionData): number {
    const cells = this.getCounterBingoCells(counterPrediction);
    return cells.filter(cell => cell.team).length;
  }

  getCounterBingoTotalCells(counterPrediction: CounterPredictionData): number {
    return this.getCounterBingoCells(counterPrediction).length;
  }

  getCounterBingoCompletionPercentage(counterPrediction: CounterPredictionData): number {
    const assigned = this.getCounterBingoAssignedCount(counterPrediction);
    const total = this.getCounterBingoTotalCells(counterPrediction);
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
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
    // For ranking predictions, extract teams from the rank table
    if (this.isRankingType() && this.hasOriginalRankingData()) {
      const originalRankingData = this.getOriginalRankingData();
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

      return teams;
    }

    // For bingo predictions, extract teams from bingo cells
    if (this.isBingoType() && this.hasOriginalBingoData()) {
      const originalBingoData = this.getOriginalBingoData();
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

      return teams;
    }

    return [];
  }

  // HELPER METHODS FOR RANKING DATA
  hasOriginalRankingData(): boolean {
    const isRanking = this.isRankingType();
    const hasPostRanks = this.predictionDetail?.postRanks && this.predictionDetail.postRanks.length > 0;
    const originalData = this.getOriginalRankingData();
    const hasRankTable = originalData?.rankTable?.rows && originalData.rankTable.rows.length > 0;

    return isRanking && hasPostRanks && hasRankTable;
  }

  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks || this.predictionDetail.postRanks.length === 0) {
      return null;
    }

    // Find the post by the prediction author (original post)
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

  // HELPER METHODS FOR BINGO DATA
  hasOriginalBingoData(): boolean {
    const isBingo = this.isBingoType();
    const hasPostBingos = this.predictionDetail?.postBingos && this.predictionDetail.postBingos.length > 0;
    const originalData = this.getOriginalBingoData();
    const hasBingoCells = originalData?.bingoCells && originalData.bingoCells.length > 0;
    return isBingo && hasPostBingos && hasBingoCells;
  }

  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos || this.predictionDetail.postBingos.length === 0) {
      return null;
    }

    // Find the post by the prediction author (original post)
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
  formatDate(dateString: string | Date): string {
    if (!dateString) return 'Not available';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Check for default/invalid dates
      if (date.getFullYear() <= 1901) {
        return 'Not available';
      }

      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  }

  formatDateShort(dateString: string | Date): string {
    if (!dateString) return 'N/A';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime()) || date.getFullYear() <= 1901) {
        return 'N/A';
      }

      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'N/A';
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

  scrollToCounterPrediction(): void {
    const element = document.querySelector('app-counter-prediction');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToCounterPredictions(): void {
    const element = document.getElementById('counter-predictions');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    if (this.userHasCounterPrediction(currentUser.id)) {
      return 'You have already created a counter prediction for this post.';
    }

    return 'Counter prediction is not available for this post.';
  }

  getDebugStructure(): string {
    if (!this.predictionDetail) return 'No prediction data';

    const structure = {
      id: this.predictionDetail.id,
      userId: this.predictionDetail.userId,
      predictionType: this.predictionDetail.predictionType,
      postRanks: this.predictionDetail.postRanks?.map(pr => ({
        id: pr.id,
        userId: pr.userId,
        isOriginal: pr.userId === this.predictionDetail?.userId
      })) || [],
      postBingos: this.predictionDetail.postBingos?.map(pb => ({
        id: pb.id,
        userId: pb.userId,
        isOriginal: pb.userId === this.predictionDetail?.userId
      })) || [],
      totalCounterPredictions: this.getAllCounterPredictions().length
    };

    return JSON.stringify(structure, null, 2);
  }

  goBack(): void {
    this.router.navigate(['/published-posts']);
  }
}
