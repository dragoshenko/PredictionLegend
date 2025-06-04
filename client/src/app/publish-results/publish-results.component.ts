// client/src/app/publish-results/publish-results.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { PredictionResultsService, PublishResultsRequest, PostRankData, PostBingoData, RowData, ColumnData, BingoCellData, TeamData } from '../_services/prediction-results.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface PredictionDetail {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  author: any;
  postRanks?: any[];
  postBingos?: any[];
  postBrackets?: any[];
}

@Component({
  selector: 'app-publish-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4" *ngIf="predictionDetail">
      <!-- Header -->
      <div class="card bg-warning border-warning mb-4">
        <div class="card-header bg-warning border-warning">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-dark mb-1">
                <i class="fa fa-trophy me-2"></i>Publish Official Results
              </h2>
              <p class="text-dark mb-0 opacity-75">
                Enter the actual results for "{{ predictionDetail.title }}" to score all counter predictions
              </p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-dark" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Publishing Form -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <form (ngSubmit)="publishResults()" #resultsForm="ngForm">
            <!-- Notes Section -->
            <div class="mb-4">
              <label class="form-label text-light fw-bold">
                <i class="fa fa-sticky-note me-2"></i>Results Notes (Optional)
              </label>
              <textarea
                class="form-control bg-dark text-light border-secondary"
                [(ngModel)]="publishRequest.notes"
                name="notes"
                rows="3"
                placeholder="Add any notes about the final results, data sources, or important details...">
              </textarea>
              <div class="form-text text-muted">
                These notes will be displayed with the official results.
              </div>
            </div>

            <!-- Ranking Results Editor -->
            <div *ngIf="predictionDetail.predictionType === 'Ranking'" class="mb-4">
              <h5 class="text-light mb-3">
                <i class="fa fa-list-ol me-2"></i>Official Ranking Results
              </h5>
              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Instructions:</strong> Arrange the teams in their final positions based on the actual results.
                Counter predictions will be scored based on exact position matches (100 points per correct position).
              </div>

              <div class="ranking-editor bg-dark border-secondary rounded p-3">
                <div class="table-responsive">
                  <table class="table table-dark table-hover">
                    <thead>
                      <tr class="table-warning">
                        <th width="80">Rank</th>
                        <th *ngFor="let col of getFirstRowColumns(); let i = index">
                          Position {{ i + 1 }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of getResultsRankingRows(); let rowIndex = index" class="ranking-row">
                        <td class="fw-bold text-warning align-middle">
                          <i class="fa fa-trophy me-1"></i>#{{ row.order }}
                        </td>
                        <td *ngFor="let column of row.columns || []; let colIndex = index" class="p-2">
                          <div class="team-selector">
                            <select
                              class="form-select form-select-sm bg-secondary text-light border-dark"
                              [(ngModel)]="column.teamId"
                              [name]="'team_' + rowIndex + '_' + colIndex"
                              (change)="onTeamSelection(rowIndex, colIndex, $event)">
                              <option value="">-- Select Team --</option>
                              <option *ngFor="let team of availableTeams" [value]="team.id">
                                {{ team.name }}
                              </option>
                            </select>

                            <!-- Selected Team Display -->
                            <div *ngIf="column.team" class="selected-team-display mt-2 p-2 bg-success rounded">
                              <div class="d-flex align-items-center">
                                <img *ngIf="column.team.photoUrl"
                                     [src]="column.team.photoUrl"
                                     class="rounded me-2" width="24" height="24" alt="Team">
                                <div class="bg-warning rounded-circle me-2 d-flex align-items-center justify-content-center"
                                     *ngIf="!column.team.photoUrl"
                                     style="width: 24px; height: 24px;">
                                  <i class="fa fa-trophy text-dark" style="font-size: 12px;"></i>
                                </div>
                                <div>
                                  <div class="fw-bold text-white small">{{ column.team.name }}</div>
                                  <div class="very-small text-light opacity-75" *ngIf="column.team.description">
                                    {{ column.team.description }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Bingo Results Editor -->
            <div *ngIf="predictionDetail.predictionType === 'Bingo'" class="mb-4">
              <h5 class="text-light mb-3">
                <i class="fa fa-th me-2"></i>Official Bingo Results
              </h5>
              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Instructions:</strong> Select which teams ended up in each bingo cell based on the actual results.
                Counter predictions will be scored based on exact cell matches (100 points per correct cell).
              </div>

              <div class="bingo-editor bg-dark border-secondary rounded p-3">
                <div class="bingo-grid"
                     [style.grid-template-columns]="'repeat(' + getBingoGridSize() + ', 1fr)'"
                     [style.gap]="'8px'"
                     [style.display]="'grid'"
                     [style.max-width]="'500px'"
                     [style.margin]="'0 auto'">

                  <div *ngFor="let cell of getResultsBingoCells(); let cellIndex = index"
                       class="bingo-cell-editor p-2 border border-secondary rounded text-center bg-secondary"
                       style="min-height: 120px;">

                    <div class="cell-header mb-2">
                      <small class="text-muted">{{ getCellPosition(cell) }}</small>
                    </div>

                    <select
                      class="form-select form-select-sm bg-dark text-light border-secondary mb-2"
                      [(ngModel)]="cell.teamId"
                      [name]="'bingo_' + cellIndex"
                      (change)="onBingoTeamSelection(cellIndex, $event)">
                      <option value="">-- Select Team --</option>
                      <option *ngFor="let team of availableTeams" [value]="team.id">
                        {{ team.name }}
                      </option>
                    </select>

                    <!-- Selected Team Display -->
                    <div *ngIf="cell.team" class="selected-team-display p-2 bg-success rounded">
                      <img *ngIf="cell.team.photoUrl"
                           [src]="cell.team.photoUrl"
                           class="rounded mb-1" width="20" height="20" alt="Team">
                      <div class="bg-warning rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center"
                           *ngIf="!cell.team.photoUrl"
                           style="width: 20px; height: 20px;">
                        <i class="fa fa-trophy text-dark" style="font-size: 10px;"></i>
                      </div>
                      <div class="very-small text-white fw-bold">{{ cell.team.name }}</div>
                    </div>

                    <div *ngIf="!cell.team" class="empty-cell-display text-muted">
                      <i class="fa fa-square-o fa-lg"></i>
                      <div class="very-small mt-1">Empty</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Summary -->
            <div class="alert alert-warning" *ngIf="!canPublish()">
              <i class="fa fa-exclamation-triangle me-2"></i>
              <strong>Please complete the results:</strong>
              You need to assign at least one team to a position before publishing results.
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-3 justify-content-between">
              <div class="d-flex gap-2">
                <button type="submit"
                        class="btn btn-warning btn-lg"
                        [disabled]="isPublishing || !canPublish()">
                  <i class="fa fa-trophy me-2"></i>
                  <span *ngIf="!isPublishing">Publish Official Results</span>
                  <span *ngIf="isPublishing">
                    <i class="fa fa-spinner fa-spin me-2"></i>Publishing...
                  </span>
                </button>
                <button type="button" class="btn btn-secondary btn-lg" (click)="goBack()">
                  <i class="fa fa-times me-2"></i>Cancel
                </button>
              </div>

              <!-- Helper Info -->
              <div class="alert alert-info mb-0 d-flex align-items-center">
                <i class="fa fa-lightbulb-o me-2"></i>
                <small>
                  Publishing results will automatically score all {{ getCounterPredictionsCount() }} counter predictions
                  and create a leaderboard.
                </small>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Preview of Counter Predictions to be Scored -->
      <div class="card bg-dark border-dark mb-4" *ngIf="getCounterPredictionsCount() > 0">
        <div class="card-header bg-dark border-dark">
          <h5 class="text-light mb-0">
            <i class="fa fa-users me-2"></i>Counter Predictions to be Scored ({{ getCounterPredictionsCount() }})
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div *ngFor="let counter of getCounterPredictions().slice(0, 6)" class="col-md-4 mb-2">
              <div class="d-flex align-items-center p-2 bg-secondary rounded">
                <img *ngIf="counter.user?.photoUrl"
                     [src]="counter.user.photoUrl"
                     class="rounded-circle me-2" width="24" height="24" alt="User">
                <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                     *ngIf="!counter.user?.photoUrl"
                     style="width: 24px; height: 24px;">
                  <i class="fa fa-user text-white small"></i>
                </div>
                <div>
                  <div class="small fw-bold text-light">{{ counter.user?.displayName || 'Anonymous' }}</div>
                  <div class="very-small text-muted">{{ formatDate(counter.createdAt) }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="getCounterPredictionsCount() > 6" class="col-md-4 mb-2">
              <div class="d-flex align-items-center p-2 bg-secondary rounded text-center">
                <div class="w-100 small text-muted">
                  +{{ getCounterPredictionsCount() - 6 }} more predictions to score
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!predictionDetail && isLoading" class="text-center py-5">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading prediction details...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!predictionDetail && !isLoading" class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-warning">Cannot Publish Results</h5>
      <p class="text-muted">
        This prediction doesn't exist, you don't have permission to publish results,
        or results have already been published.
      </p>
      <button class="btn btn-primary" (click)="goBack()">Go Back</button>
    </div>
  `,
  styles: [`
    .very-small {
      font-size: 0.65rem;
    }

    .ranking-row:hover {
      background-color: rgba(255, 193, 7, 0.1) !important;
    }

    .team-selector .form-select {
      transition: all 0.2s ease;
    }

    .team-selector .form-select:focus {
      border-color: #ffc107;
      box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
    }

    .selected-team-display {
      animation: fadeIn 0.3s ease;
    }

    .bingo-cell-editor {
      transition: all 0.2s ease;
    }

    .bingo-cell-editor:hover {
      background-color: rgba(255, 193, 7, 0.1) !important;
      border-color: #ffc107 !important;
    }

    .bingo-grid {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.1rem;
    }

    .table-warning th {
      background-color: #ffc107 !important;
      color: #000 !important;
      border-color: #e0a800 !important;
    }
  `]
})
export class PublishResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);
  private resultsService = inject(PredictionResultsService);

  predictionDetail: PredictionDetail | null = null;
  availableTeams: TeamData[] = [];
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
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.publishRequest.predictionId = predictionId;
        this.loadPredictionDetails(predictionId);
        this.checkPublishPermission(predictionId);
      }
    });
  }

  async loadPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.http.get<PredictionDetail>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      if (response) {
        this.predictionDetail = response;
        this.publishRequest.predictionType = response.predictionType;
        this.extractAvailableTeams();
        this.initializeResultsStructure();
      }
    } catch (error) {
      console.error('Error loading prediction details:', error);
      this.toastr.error('Failed to load prediction details');
    } finally {
      this.isLoading = false;
    }
  }

  async checkPublishPermission(predictionId: number): Promise<void> {
    try {
      const canPublish = await this.resultsService.canPublishResults(predictionId).toPromise();
      if (!canPublish) {
        this.toastr.error('You cannot publish results for this prediction');
        this.goBack();
      }
    } catch (error) {
      console.error('Error checking publish permission:', error);
      this.toastr.error('Unable to verify publish permission');
      this.goBack();
    }
  }

  private extractAvailableTeams(): void {
    const teams: TeamData[] = [];
    const seenTeamIds = new Set<number>();

    // Extract teams from ranking posts
    if (this.predictionDetail?.postRanks) {
      this.predictionDetail.postRanks.forEach(postRank => {
        if (postRank.rankTable?.rows) {
          postRank.rankTable.rows.forEach((row: any) => {
            if (row.columns) {
              row.columns.forEach((column: any) => {
                if (column.team && !seenTeamIds.has(column.team.id)) {
                  seenTeamIds.add(column.team.id);
                  teams.push(this.mapTeamData(column.team));
                }
              });
            }
          });
        }
      });
    }

    // Extract teams from bingo posts
    if (this.predictionDetail?.postBingos) {
      this.predictionDetail.postBingos.forEach(postBingo => {
        if (postBingo.bingoCells) {
          postBingo.bingoCells.forEach((cell: any) => {
            if (cell.team && !seenTeamIds.has(cell.team.id)) {
              seenTeamIds.add(cell.team.id);
              teams.push(this.mapTeamData(cell.team));
            }
          });
        }
      });
    }

    this.availableTeams = teams.sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapTeamData(teamObj: any): TeamData {
    return {
      id: teamObj.id,
      name: teamObj.name || 'Unnamed Team',
      description: teamObj.description || '',
      photoUrl: teamObj.photoUrl || '',
      createdByUserId: teamObj.createdByUserId || 0,
      createdAt: teamObj.createdAt ? new Date(teamObj.createdAt) : new Date()
    };
  }

  private initializeResultsStructure(): void {
    if (!this.predictionDetail) return;

    if (this.predictionDetail.predictionType === 'Ranking') {
      this.initializeRankingResults();
    } else if (this.predictionDetail.predictionType === 'Bingo') {
      this.initializeBingoResults();
    }
  }

  private initializeRankingResults(): void {
    const originalRanking = this.getOriginalRanking();
    if (!originalRanking?.rankTable) return;

    this.publishRequest.resultsPostRank = {
      id: 0,
      rankingTemplateId: originalRanking.rankingTemplateId || 1,
      predictionId: this.publishRequest.predictionId,
      userId: this.accountService.currentUser()?.id || 0,
      rankTable: {
        id: 0,
        numberOfRows: originalRanking.rankTable.numberOfRows,
        numberOfColumns: originalRanking.rankTable.numberOfColumns,
        rows: []
      },
      isOfficialResult: true,
      totalScore: 0,
      rankTeams: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize empty rank table structure
    for (let i = 0; i < originalRanking.rankTable.numberOfRows; i++) {
      const row: RowData = {
        id: 0,
        order: i + 1,
        columns: [],
        isWrong: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      for (let j = 0; j < originalRanking.rankTable.numberOfColumns; j++) {
        const column: ColumnData = {
          id: 0,
          team: null,
          teamId: null,
          officialScore: 0,
          order: j + 1
        };
        row.columns.push(column);
      }

      this.publishRequest.resultsPostRank.rankTable.rows.push(row);
    }
  }

  private initializeBingoResults(): void {
    const originalBingo = this.getOriginalBingo();
    if (!originalBingo) return;

    this.publishRequest.resultsPostBingo = {
      id: 0,
      userId: this.accountService.currentUser()?.id || 0,
      gridSize: originalBingo.gridSize,
      bingoCells: [],
      teams: [],
      totalScore: 0,
      isOfficialResult: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize empty bingo cells
    for (let row = 0; row < originalBingo.gridSize; row++) {
      for (let col = 0; col < originalBingo.gridSize; col++) {
        const cell: BingoCellData = {
          id: 0,
          score: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          bingoId: 0,
          row: row,
          column: col,
          team: null,
          teamId: null,
          officialScore: 0,
          isWrong: false
        };
        this.publishRequest.resultsPostBingo.bingoCells.push(cell);
      }
    }
  }

  onTeamSelection(rowIndex: number, colIndex: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const teamId = target.value ? parseInt(target.value) : null;

    if (this.publishRequest.resultsPostRank?.rankTable?.rows) {
      const column = this.publishRequest.resultsPostRank.rankTable.rows[rowIndex].columns[colIndex];

      if (teamId) {
        const selectedTeam = this.availableTeams.find(t => t.id === teamId);
        column.team = selectedTeam || null;
        column.teamId = teamId;
      } else {
        column.team = null;
        column.teamId = null;
      }
    }
  }

  onBingoTeamSelection(cellIndex: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const teamId = target.value ? parseInt(target.value) : null;

    if (this.publishRequest.resultsPostBingo?.bingoCells) {
      const cell = this.publishRequest.resultsPostBingo.bingoCells[cellIndex];

      if (teamId) {
        const selectedTeam = this.availableTeams.find(t => t.id === teamId);
        cell.team = selectedTeam || null;
        cell.teamId = teamId;
      } else {
        cell.team = null;
        cell.teamId = null;
      }
    }
  }

  async publishResults(): Promise<void> {
    if (!this.canPublish()) {
      this.toastr.warning('Please complete the results before publishing');
      return;
    }

    const confirmMessage = `Are you sure you want to publish these official results?\n\n` +
      `This will:\n` +
      `• Score all ${this.getCounterPredictionsCount()} counter predictions\n` +
      `• Create a public leaderboard\n` +
      `• Cannot be undone\n\n` +
      `Continue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.isPublishing = true;
    try {
      await this.resultsService.publishResults(this.publishRequest).toPromise();

      this.toastr.success('Official results published successfully! All counter predictions have been scored.');

      // Navigate to the results view
      this.router.navigate(['/prediction-results', this.publishRequest.predictionId]);

    } catch (error: any) {
      console.error('Error publishing results:', error);

      if (error.status === 400) {
        this.toastr.error(error.error?.message || 'Invalid results data');
      } else if (error.status === 403) {
        this.toastr.error('You do not have permission to publish results');
      } else if (error.status === 409) {
        this.toastr.error('Results have already been published for this prediction');
      } else {
        this.toastr.error('Failed to publish results. Please try again.');
      }
    } finally {
      this.isPublishing = false;
    }
  }

  canPublish(): boolean {
    if (this.predictionDetail?.predictionType === 'Ranking') {
      return this.publishRequest.resultsPostRank?.rankTable?.rows?.some((row: any) =>
        row.columns?.some((col: any) => col.team)
      ) || false;
    } else if (this.predictionDetail?.predictionType === 'Bingo') {
      return this.publishRequest.resultsPostBingo?.bingoCells?.some((cell: any) => cell.team) || false;
    }
    return false;
  }

  // Helper methods for template
  getOriginalRanking(): any {
    if (!this.predictionDetail?.postRanks) return null;
    return this.predictionDetail.postRanks.find(pr => pr.userId === this.predictionDetail?.author?.id) ||
           this.predictionDetail.postRanks[0];
  }

  getOriginalBingo(): any {
    if (!this.predictionDetail?.postBingos) return null;
    return this.predictionDetail.postBingos.find(pb => pb.userId === this.predictionDetail?.author?.id) ||
           this.predictionDetail.postBingos[0];
  }

  getResultsRankingRows(): RowData[] {
    return this.publishRequest.resultsPostRank?.rankTable?.rows || [];
  }

  getFirstRowColumns(): ColumnData[] {
    const rows = this.getResultsRankingRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getResultsBingoCells(): BingoCellData[] {
    return this.publishRequest.resultsPostBingo?.bingoCells || [];
  }

  getBingoGridSize(): number {
    return this.publishRequest.resultsPostBingo?.gridSize || 5;
  }

  getCellPosition(cell: any): string {
    return `R${cell.row + 1}C${cell.column + 1}`;
  }

  getCounterPredictions(): any[] {
    const counters: any[] = [];

    if (this.predictionDetail?.postRanks) {
      this.predictionDetail.postRanks.forEach(pr => {
        if (pr.userId !== this.predictionDetail?.author?.id) {
          counters.push(pr);
        }
      });
    }

    if (this.predictionDetail?.postBingos) {
      this.predictionDetail.postBingos.forEach(pb => {
        if (pb.userId !== this.predictionDetail?.author?.id) {
          counters.push(pb);
        }
      });
    }

    return counters;
  }

  getCounterPredictionsCount(): number {
    return this.getCounterPredictions().length;
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Unknown';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
