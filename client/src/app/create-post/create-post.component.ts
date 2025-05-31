import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../_models/team';
import { PredictionType } from '../_models/predictionType';
import { ToastrService } from 'ngx-toastr';
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

interface SelectedSlot {
  type: 'ranking' | 'bingo';
  rowIndex?: number;
  colIndex?: number;
  cellIndex?: number;
}

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  // Map for prediction types
  predictionTypeMap = {
    [PredictionType.Ranking]: 0,
    [PredictionType.Bracket]: 1,
    [PredictionType.Bingo]: 2
  };

  // Route parameters
  predictionId: number = 0;
  templateId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;
  template: any = null;
  selectedTeams: Team[] = [];

  // Post data
  postRank: PostRankData | null = null;
  postBingo: PostBingoData | null = null;

  // Selection state for click-to-assign
  selectedTeamForAssignment: Team | null = null;
  selectedSlot: SelectedSlot | null = null;

  // Forms
  postForm: FormGroup = new FormGroup({});

  // UI State
  isLoading = false;
  isSubmitting = false;

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
      console.log('Loaded route params:', {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionType
      });
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

  // Team selection for assignment
  selectTeamForAssignment(team: Team): void {
    if (this.selectedTeamForAssignment?.id === team.id) {
      // Deselect if clicking the same team
      this.selectedTeamForAssignment = null;
      this.selectedSlot = null;
      this.toastr.info('Team deselected');
    } else {
      // Select new team
      this.selectedTeamForAssignment = team;
      this.selectedSlot = null;
      this.toastr.success(`${team.name} selected. Click on a position to assign it.`);
    }
  }

  // Handle slot clicks for assignment
  handleSlotClick(type: 'ranking' | 'bingo', ...args: number[]): void {
    if (!this.selectedTeamForAssignment) {
      this.toastr.info('Please select a team first');
      return;
    }

    if (type === 'ranking') {
      const [rowIndex, colIndex] = args;
      this.assignTeamToRankingSlot(rowIndex, colIndex);
    } else if (type === 'bingo') {
      const [cellIndex] = args;
      this.assignTeamToBingoCell(cellIndex);
    }
  }

  assignTeamToRankingSlot(rowIndex: number, columnIndex: number): void {
    if (!this.postRank || !this.selectedTeamForAssignment) return;

    const targetSlot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (!targetSlot) return;

    if (targetSlot.team) {
      this.toastr.warning('This position is already occupied');
      return;
    }

    // Check if team is already assigned somewhere else
    const existingPosition = this.findTeamInRanking(this.selectedTeamForAssignment.id);
    if (existingPosition) {
      // Remove from existing position
      const existingSlot = this.postRank.rankTable.rows[existingPosition.rowIndex].columns[existingPosition.colIndex];
      existingSlot.team = null;
    }

    // Assign to new position
    targetSlot.team = this.selectedTeamForAssignment;
    this.toastr.success(`${this.selectedTeamForAssignment.name} assigned to rank ${rowIndex + 1}`);

    // Clear selection after assignment
    this.selectedTeamForAssignment = null;
    this.selectedSlot = null;
  }

  assignTeamToBingoCell(cellIndex: number): void {
    if (!this.postBingo || !this.selectedTeamForAssignment) return;

    const targetCell = this.postBingo.bingoCells[cellIndex];
    if (!targetCell) return;

    if (targetCell.team) {
      this.toastr.warning('This bingo square is already occupied');
      return;
    }

    // Check if team is already assigned somewhere else
    const existingCellIndex = this.findTeamInBingo(this.selectedTeamForAssignment.id);
    if (existingCellIndex !== -1) {
      // Remove from existing position
      this.postBingo.bingoCells[existingCellIndex].team = null;
    }

    // Assign to new position
    targetCell.team = this.selectedTeamForAssignment;
    this.toastr.success(`${this.selectedTeamForAssignment.name} assigned to bingo square`);

    // Clear selection after assignment
    this.selectedTeamForAssignment = null;
    this.selectedSlot = null;
  }

  // Helper methods to find existing team positions
  findTeamInRanking(teamId: number): { rowIndex: number; colIndex: number } | null {
    if (!this.postRank) return null;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length; colIndex++) {
        if (this.postRank.rankTable.rows[rowIndex].columns[colIndex].team?.id === teamId) {
          return { rowIndex, colIndex };
        }
      }
    }
    return null;
  }

  findTeamInBingo(teamId: number): number {
    if (!this.postBingo) return -1;

    return this.postBingo.bingoCells.findIndex(cell => cell.team?.id === teamId);
  }

  // Clear selection
  clearSelection(): void {
    this.selectedTeamForAssignment = null;
    this.selectedSlot = null;
    this.toastr.info('Selection cleared');
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
    this.clearSelection(); // Clear any active selection
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
    this.clearSelection(); // Clear any active selection
  }

  clearAll(): void {
    if (this.predictionType === PredictionType.Ranking) {
      this.clearAllRankings();
    } else if (this.predictionType === PredictionType.Bingo) {
      this.clearAllBingo();
    }
    this.clearSelection(); // Clear any active selection
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
    this.clearSelection(); // Clear any active selection
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
    this.clearSelection(); // Clear any active selection
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

      if ((this.predictionType === PredictionType.Ranking && !this.postRank) ||
          (this.predictionType === PredictionType.Bingo && !this.postBingo) ||
          !this.template) {
        this.toastr.error('Missing required data. Please refresh and try again.');
        this.isSubmitting = false;
        return;
      }

      const publishRequest: any = {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionTypeMap[this.predictionType],
        notes: this.postForm.get('notes')?.value || '',
        isDraft: this.postForm.get('isDraft')?.value || false,
      };

      if (this.predictionType === PredictionType.Ranking && this.postRank) {
        publishRequest.postRank = {
          rankingTemplateId: this.templateId,
          predictionId: this.predictionId,
          rankTable: {
            numberOfRows: this.postRank.rankTable.numberOfRows,
            numberOfColumns: this.postRank.rankTable.numberOfColumns,
            rows: this.postRank.rankTable.rows.map((row, rowIndex) => ({
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: row.order,
              isWrong: false,
              columns: row.columns.map((column, colIndex) => ({
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
      }

      console.log('Request payload:', JSON.stringify(publishRequest, null, 2));

      const apiUrl = `${environment.apiUrl}post/rank/publish`;

      this.http.post(apiUrl, publishRequest).subscribe({
        next: (res) => {
          const isDraft = this.postForm.get('isDraft')?.value;
          if (isDraft) {
            this.toastr.success('Prediction saved as draft successfully!');
          } else {
            this.toastr.success('Prediction published successfully!');
          }
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('=== SUBMISSION ERROR ===');
          console.error('Full error:', error);

          let errorMessage = 'Failed to publish prediction';

          if (error.status === 400) {
            if (Array.isArray(error.error)) {
              errorMessage = `Validation errors: ${error.error.join(', ')}`;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (typeof error.error === 'object') {
              errorMessage = error.error.message || error.error.title || `Server error: ${JSON.stringify(error.error)}`;
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
        }
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      this.toastr.error('Unexpected error occurred.');
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
