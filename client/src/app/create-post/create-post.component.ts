import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../_models/team';
import { PredictionType } from '../_models/predictionType';
import { ToastrService } from 'ngx-toastr';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Optimized interfaces
interface RankColumn {
  team: Team | null;
  officialScore: number;
  order: number;
}

interface RankRow {
  order: number;
  columns: RankColumn[];
  isWrong?: boolean;
}

interface RankTable {
  numberOfRows: number;
  numberOfColumns: number;
  rows: RankRow[];
}

interface PostRankData {
  rankTable: RankTable;
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
}

interface BingoCell {
  row: number;
  column: number;
  team: Team | null;
  score: number;
  officialScore: number;
  isWrong?: boolean;
}

interface PostBingoData {
  gridSize: number;
  bingoCells: BingoCell[];
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
}

interface PublishPostRequest {
  predictionId: number;
  templateId: number;
  predictionType: PredictionType | string;
  notes: string;
  isDraft: boolean;
  postRank?: PostRankData | null;
  postBracket?: any;
  postBingo?: PostBingoData | null;
}

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Route parameters
  predictionId: number = 0;
  templateId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;
  template: any = null;
  selectedTeams: Team[] = [];
  predictionTypeEnumMap = {
    [PredictionType.Ranking]: 0,
    [PredictionType.Bracket]: 1,
    [PredictionType.Bingo]: 2,
  };

  // Post data
  postRank: PostRankData | null = null;
  postBingo: PostBingoData | null = null;

  // Forms
  postForm: FormGroup = new FormGroup({});

  // UI State
  isLoading = false;
  isSubmitting = false;

  // Track by functions for performance
  trackByTeamId = (index: number, team: Team): number => team.id;
  trackByRowIndex = (index: number, row: RankRow): number => row.order;
  trackByIndex = (index: number): number => index;
  trackByCellIndex = (index: number, cell: BingoCell): number => index;

  ngOnInit(): void {
    this.initializeForm();
    this.loadRouteData();

    // Small delay to ensure navigation state is available
    setTimeout(() => {
      this.initializePostStructure();
    }, 50);
  }

  initializeForm(): void {
    this.postForm = this.fb.group({
      isDraft: [false],
      notes: ['']
    });
  }

  loadRouteData(): void {
    this.route.params.subscribe(params => {
      this.predictionId = +params['predictionId'];
      this.templateId = +params['templateId'];
      this.predictionType = params['type'] as PredictionType;
    });

    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.selectedTeams = navigation.extras.state['selectedTeams'] || [];
      this.template = navigation.extras.state['template'] || null;
    } else {
      // Fallback to browser history state
      const historyState = history.state;
      if (historyState?.selectedTeams) {
        this.selectedTeams = historyState.selectedTeams;
        this.template = historyState.template;
      } else {
        this.toastr.error('Missing required data. Redirecting back to team selection.');
        this.goBack();
        return;
      }
    }

    // Validate required data
    if (!this.selectedTeams?.length || !this.template) {
      this.toastr.error('Missing teams or template data. Please go back and try again.');
      this.goBack();
      return;
    }
  }

  initializePostStructure(): void {
    if (!this.template) return;

    switch (this.predictionType) {
      case PredictionType.Ranking:
        this.initializeRankingPost();
        break;
      case PredictionType.Bingo:
        this.initializeBingoPost();
        break;
      // Add bracket case when implemented
    }
  }

  initializeRankingPost(): void {
    const numberOfRows = this.template?.numberOfRows || 10;
    const numberOfColumns = this.template?.numberOfColumns || 1;

    this.postRank = {
      rankTable: {
        numberOfRows,
        numberOfColumns,
        rows: []
      },
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize empty rows
    for (let i = 0; i < numberOfRows; i++) {
      const row: RankRow = {
        order: i + 1,
        columns: []
      };

      for (let j = 0; j < numberOfColumns; j++) {
        row.columns.push({
          team: null,
          officialScore: 0,
          order: j
        });
      }

      this.postRank.rankTable.rows.push(row);
    }
  }

  initializeBingoPost(): void {
    const gridSize = this.template?.gridSize || 5;

    this.postBingo = {
      gridSize,
      bingoCells: [],
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize bingo cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell: BingoCell = {
          row,
          column: col,
          team: null,
          score: 0,
          officialScore: 0,
          isWrong: false
        };
        this.postBingo.bingoCells.push(cell);
      }
    }
  }

  // Optimized drag & drop for Rankings
  dropTeamInRanking(event: CdkDragDrop<any>, rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    const targetSlot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (!targetSlot) return;

    // Check if dropping from available teams list
    if (event.previousContainer.id === 'available-teams') {
      const draggedTeam = event.item.data as Team;

      // Check if slot is empty
      if (!targetSlot.team) {
        targetSlot.team = draggedTeam;
        this.toastr.success(`${draggedTeam.name} assigned to rank ${rowIndex + 1}`);
      } else {
        this.toastr.warning('This position is already occupied');
      }
    }
  }

  // Drag & drop for Bingo
  dropTeamInBingo(event: CdkDragDrop<any>, cellIndex: number): void {
    if (!this.postBingo) return;

    const targetCell = this.postBingo.bingoCells[cellIndex];
    if (!targetCell) return;

    // Check if dropping from available teams list
    if (event.previousContainer.id === 'available-teams') {
      const draggedTeam = event.item.data as Team;

      // Check if cell is empty
      if (!targetCell.team) {
        targetCell.team = draggedTeam;
        this.toastr.success(`${draggedTeam.name} assigned to bingo square`);
      } else {
        this.toastr.warning('This bingo square is already occupied');
      }
    }
  }

  // Team removal methods
  removeTeamFromSlot(rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    const slot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (slot?.team) {
      const teamName = slot.team.name;
      slot.team = null;
      this.toastr.info(`${teamName} removed from ranking`);
    }
  }

  removeTeamFromBingo(cellIndex: number): void {
    if (!this.postBingo) return;

    const cell = this.postBingo.bingoCells[cellIndex];
    if (cell?.team) {
      const teamName = cell.team.name;
      cell.team = null;
      this.toastr.info(`${teamName} removed from bingo`);
    }
  }

  // Get available teams (not assigned to any position)
  getAvailableTeams(): Team[] {
    const usedTeamIds = new Set<number>();

    if (this.predictionType === PredictionType.Ranking && this.postRank) {
      this.postRank.rankTable.rows.forEach(row => {
        row.columns.forEach(col => {
          if (col.team) {
            usedTeamIds.add(col.team.id);
          }
        });
      });
    } else if (this.predictionType === PredictionType.Bingo && this.postBingo) {
      this.postBingo.bingoCells.forEach(cell => {
        if (cell.team) {
          usedTeamIds.add(cell.team.id);
        }
      });
    }

    return this.selectedTeams.filter(team => !usedTeamIds.has(team.id));
  }

  // Quick action methods
  autoFillRanking(): void {
    if (!this.postRank) return;

    const availableTeams = this.getAvailableTeams();
    let teamIndex = 0;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < availableTeams.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < availableTeams.length; colIndex++) {
        const slot = this.postRank.rankTable.rows[rowIndex].columns[colIndex];
        if (!slot.team) {
          slot.team = availableTeams[teamIndex++];
        }
      }
    }

    this.toastr.success(`Auto-filled ${teamIndex} positions`);
  }

  autoFillBingo(): void {
    if (!this.postBingo) return;

    const availableTeams = this.getAvailableTeams();
    const emptyCells = this.postBingo.bingoCells.filter(cell => !cell.team);

    // Randomly select cells to fill
    const cellsToFill = Math.min(availableTeams.length, emptyCells.length);
    const shuffledCells = [...emptyCells].sort(() => 0.5 - Math.random()).slice(0, cellsToFill);

    shuffledCells.forEach((cell, index) => {
      if (index < availableTeams.length) {
        cell.team = availableTeams[index];
      }
    });

    this.toastr.success(`Auto-filled ${cellsToFill} bingo squares`);
  }

  clearAll(): void {
    if (this.predictionType === PredictionType.Ranking) {
      this.clearAllRankings();
    } else if (this.predictionType === PredictionType.Bingo) {
      this.clearAllBingo();
    }
  }

  clearAllRankings(): void {
    if (!this.postRank) return;

    this.postRank.rankTable.rows.forEach(row => {
      row.columns.forEach(col => {
        col.team = null;
      });
    });

    this.toastr.info('All rankings cleared');
  }

  clearAllBingo(): void {
    if (!this.postBingo) return;

    this.postBingo.bingoCells.forEach(cell => {
      cell.team = null;
    });

    this.toastr.info('All bingo squares cleared');
  }

  shuffleTeams(): void {
    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) return;

    // Shuffle the available teams array
    const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);

    // Clear current assignments
    this.clearAllRankings();

    // Assign shuffled teams
    if (!this.postRank) return;

    let teamIndex = 0;
    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < shuffled.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < shuffled.length; colIndex++) {
        this.postRank.rankTable.rows[rowIndex].columns[colIndex].team = shuffled[teamIndex++];
      }
    }

    this.toastr.success('Teams shuffled randomly');
  }

  shuffleBingo(): void {
    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) return;

    // Clear current assignments
    this.clearAllBingo();

    if (!this.postBingo) return;

    // Randomly assign teams to cells
    const shuffledTeams = [...availableTeams].sort(() => Math.random() - 0.5);
    const emptyCells = this.postBingo.bingoCells.filter(cell => !cell.team);
    const cellsToFill = Math.min(shuffledTeams.length, emptyCells.length);
    const shuffledCells = [...emptyCells].sort(() => Math.random() - 0.5).slice(0, cellsToFill);

    shuffledCells.forEach((cell, index) => {
      if (index < shuffledTeams.length) {
        cell.team = shuffledTeams[index];
      }
    });

    this.toastr.success('Bingo squares shuffled randomly');
  }

  // Progress tracking
  getAssignedTeamsCount(): number {
    if (this.predictionType === PredictionType.Ranking && this.postRank) {
      let count = 0;
      this.postRank.rankTable.rows.forEach(row => {
        row.columns.forEach(col => {
          if (col.team) count++;
        });
      });
      return count;
    } else if (this.predictionType === PredictionType.Bingo && this.postBingo) {
      return this.postBingo.bingoCells.filter(cell => cell.team).length;
    }
    return 0;
  }

  getTotalSlotsCount(): number {
    if (this.predictionType === PredictionType.Ranking && this.postRank) {
      return this.postRank.rankTable.numberOfRows * this.postRank.rankTable.numberOfColumns;
    } else if (this.predictionType === PredictionType.Bingo && this.postBingo) {
      return this.postBingo.bingoCells.length;
    }
    return 0;
  }

  getProgressPercentage(): number {
    const total = this.getTotalSlotsCount();
    if (total === 0) return 0;
    return Math.round((this.getAssignedTeamsCount() / total) * 100);
  }

  // Validation
  isValidPost(): boolean {
    if (this.predictionType === PredictionType.Ranking && this.postRank) {
      return this.postRank.rankTable.rows.some(row =>
        row.columns.some(col => col.team !== null)
      );
    } else if (this.predictionType === PredictionType.Bingo && this.postBingo) {
      return this.postBingo.bingoCells.some(cell => cell.team !== null);
    }
    return false;
  }

  // Submit post
  async submitPost(): Promise<void> {
    if (!this.isValidPost()) {
      this.toastr.error('Please assign teams to at least some positions');
      return;
    }

    this.isSubmitting = true;

    try {
      console.log('=== SUBMITTING POST ===');
      console.log('predictionId:', this.predictionId);
      console.log('templateId:', this.templateId);
      console.log('predictionType:', this.predictionType);

      // Validate required data
      if ((this.predictionType === PredictionType.Ranking && !this.postRank) ||
          (this.predictionType === PredictionType.Bingo && !this.postBingo) ||
          !this.template) {
        this.toastr.error('Missing required data. Please refresh and try again.');
        this.isSubmitting = false;
        return;
      }

      // Create the request payload
      const publishRequest: any = {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionTypeEnumMap[this.predictionType],
        notes: this.postForm.get('notes')?.value || '',
        isDraft: this.postForm.get('isDraft')?.value || false,
      };

      if (this.predictionType === PredictionType.Ranking && this.postRank) {
        publishRequest.postRank = {
          id: 0,
          rankingTemplateId: this.templateId,
          predictionId: this.predictionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 0,
          rankTable: {
            id: 0,
            numberOfRows: this.postRank.rankTable.numberOfRows,
            numberOfColumns: this.postRank.rankTable.numberOfColumns,
            rows: this.postRank.rankTable.rows.map((row, rowIndex) => ({
              id: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: row.order,
              isWrong: false,
              columns: row.columns.map((column, colIndex) => ({
                id: 0,
                team: column.team ? {
                  id: column.team.id,
                  name: column.team.name,
                  description: column.team.description || '',
                  score: column.team.score || 0,
                  createdByUserId: column.team.createdByUserId,
                  createdAt: column.team.createdAt
                } : null,
                officialScore: 0,
                order: colIndex
              }))
            }))
          },
          teams: this.selectedTeams.map(team => ({
            id: team.id,
            name: team.name,
            description: team.description || '',
            score: team.score || 0,
            createdByUserId: team.createdByUserId,
            createdAt: team.createdAt
          })),
          isOfficialResult: false,
          totalScore: 0
        };
      } else if (this.predictionType === PredictionType.Bingo && this.postBingo) {
        publishRequest.postBingo = {
          id: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 0,
          gridSize: this.postBingo.gridSize,
          bingoCells: this.postBingo.bingoCells.map(cell => ({
            id: 0,
            row: cell.row,
            column: cell.column,
            team: cell.team ? {
              id: cell.team.id,
              name: cell.team.name,
              description: cell.team.description || '',
              score: cell.team.score || 0,
              createdByUserId: cell.team.createdByUserId,
              createdAt: cell.team.createdAt
            } : null,
            score: 0,
            officialScore: 0,
            isWrong: false
          })),
          teams: this.selectedTeams.map(team => ({
            id: team.id,
            name: team.name,
            description: team.description || '',
            score: team.score || 0,
            createdByUserId: team.createdByUserId,
            createdAt: team.createdAt
          })),
          totalScore: 0,
          isOfficialResult: false
        };
      }

      console.log('Request payload:', JSON.stringify(publishRequest, null, 2));

      // Make the API call
      const apiEndpoint = this.predictionType === PredictionType.Ranking
        ? `${environment.apiUrl}post/rank/publish`
        : `${environment.apiUrl}post/bingo/publish`; // You'll need to implement this endpoint

      const response = await this.http.post(apiEndpoint, publishRequest, {
        headers: { 'Content-Type': 'application/json' }
      }).toPromise();

      console.log('Success response:', response);

      const isDraft = this.postForm.get('isDraft')?.value;
      if (isDraft) {
        this.toastr.success('Prediction saved as draft successfully!');
      } else {
        this.toastr.success('Prediction published successfully!');
      }

      // Navigate to home or wherever appropriate
      this.router.navigate(['/']);

    } catch (error: any) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Full error:', error);

      let errorMessage = 'Failed to publish prediction';

      if (error.status === 400) {
        if (error.error) {
          if (Array.isArray(error.error)) {
            errorMessage = `Validation errors: ${error.error.join(', ')}`;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (typeof error.error === 'object') {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.title) {
              errorMessage = error.error.title;
            } else {
              errorMessage = `Server error: ${JSON.stringify(error.error)}`;
            }
          }
        }
      } else if (error.status === 401) {
        errorMessage = 'You are not authorized to perform this action. Please log in again.';
      } else if (error.status === 404) {
        errorMessage = 'API endpoint not found. Please check your server configuration.';
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Network error - cannot reach server. Check if the API is running.';
      }

      console.error('Final error message:', errorMessage);
      this.toastr.error(errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/select-teams', this.predictionId, this.templateId, this.predictionType]);
  }

  abandonFlow(): void {
    if (confirm('Are you sure you want to abandon this prediction? All progress will be lost.')) {
      this.router.navigate(['/']);
    }
  }
}
