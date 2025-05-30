import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CounterPredictionService } from '../_services/counter-prediction.service';
import { PredictionType } from '../_models/predictionType';
import { Team } from '../_models/team';
import { AccountService } from '../_services/account.service';

interface RankColumn {
  team: Team | null;
  officialScore: number;
  order: number;
}

interface RankRow {
  order: number;
  columns: RankColumn[];
  isWrong: boolean;
}

interface RankTable {
  numberOfRows: number;
  numberOfColumns: number;
  rows: RankRow[];
}

interface PostRankData {
  rankingTemplateId: number;
  predictionId: number;
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
  isWrong: boolean;
}

interface PostBingoData {
  gridSize: number;
  bingoCells: BingoCell[];
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
}

@Component({
  selector: 'app-counter-prediction',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './counter-prediction.component.html',
  styleUrls: ['./counter-prediction.component.css']
})
export class CounterPredictionComponent implements OnInit {
  @Input() originalPrediction: any = null;
  @Input() template: any = null;
  @Input() availableTeams: Team[] = [];

  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private counterPredictionService = inject(CounterPredictionService);
  private accountService = inject(AccountService);

  counterPredictionForm: FormGroup = new FormGroup({});
  selectedTeams: Team[] = [];
  showForm = signal(false);
  canCounterPredict = signal(false);
  isCheckingEligibility = signal(false);
  hasExistingCounterPrediction = signal(false);

  // Post structures for different types with proper typing
  postRank: PostRankData | null = null;
  postBingo: PostBingoData | null = null;

  // Team selection state
  selectedSlot: { rowIndex: number; colIndex: number } | null = null;
  selectedBingoCell: number | null = null;

  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForm();
    this.checkCounterPredictEligibility();

    if (this.template && this.availableTeams.length > 0) {
      this.initializeCounterPrediction();
    }

    // Check if we should auto-show the form (from URL params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'counter-predict') {
      setTimeout(() => {
        this.showForm.set(true);
        this.toastr.info('Create your counter prediction below!');
      }, 500);
    }
  }

  initializeForm(): void {
    this.counterPredictionForm = this.fb.group({
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  async checkCounterPredictEligibility(): Promise<void> {
    if (!this.originalPrediction?.id) return;

    this.isCheckingEligibility.set(true);
    try {
      console.log('Checking counter prediction eligibility for prediction:', this.originalPrediction.id);

      const canCounterPredict = await this.counterPredictionService
        .canUserCounterPredict(this.originalPrediction.id)
        .toPromise();

      this.canCounterPredict.set(canCounterPredict || false);
      console.log('Can counter predict result:', canCounterPredict);

      if (!canCounterPredict) {
        // Check if user already has a counter prediction
        try {
          const existing = await this.counterPredictionService
            .getUserCounterPrediction(this.originalPrediction.id)
            .toPromise();

          this.hasExistingCounterPrediction.set(!!existing);
        } catch (error) {
          // No existing counter prediction found
          this.hasExistingCounterPrediction.set(false);
        }
      }
    } catch (error) {
      console.error('Error checking counter prediction eligibility:', error);

      // If the API call fails, let's try to determine eligibility on the frontend
      const currentUser = this.accountService.currentUser();
      if (currentUser && this.originalPrediction) {
        const canCounterPredict =
          this.originalPrediction.userId !== currentUser.id && // Not own prediction
          !this.originalPrediction.isDraft && // Not draft
          this.originalPrediction.isActive && // Is active
          this.availableTeams.length > 0; // Has teams

        console.log('Fallback eligibility check:', canCounterPredict);
        this.canCounterPredict.set(canCounterPredict);
        this.hasExistingCounterPrediction.set(false);
      } else {
        this.canCounterPredict.set(false);
      }
    } finally {
      this.isCheckingEligibility.set(false);
    }
  }

  initializeCounterPrediction(): void {
    if (!this.originalPrediction || !this.template) return;

    // Use the same teams as the original prediction
    this.selectedTeams = [...this.availableTeams];

    // Initialize post structure based on prediction type
    switch (this.originalPrediction.predictionType) {
      case 'Ranking':
      case PredictionType.Ranking:
      case 0:
      case '0':
        this.initializeCounterRanking();
        break;
      case 'Bingo':
      case PredictionType.Bingo:
      case 2:
      case '2':
        this.initializeCounterBingo();
        break;
      default:
        console.warn('Unsupported prediction type:', this.originalPrediction.predictionType);
    }
  }

  initializeCounterRanking(): void {
    const numberOfRows = this.template.numberOfRows || 5;
    const numberOfColumns = this.template.numberOfColumns || 1;

    this.postRank = {
      rankingTemplateId: this.template.id,
      predictionId: this.originalPrediction.id,
      rankTable: {
        numberOfRows,
        numberOfColumns,
        rows: []
      },
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize empty rows for user to fill
    for (let i = 0; i < numberOfRows; i++) {
      const row: RankRow = {
        order: i + 1,
        columns: [],
        isWrong: false
      };

      for (let j = 0; j < numberOfColumns; j++) {
        const column: RankColumn = {
          team: null,
          officialScore: 0,
          order: j
        };
        row.columns.push(column);
      }

      this.postRank.rankTable.rows.push(row);
    }
  }

  initializeCounterBingo(): void {
    const gridSize = this.template.gridSize || 5;

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

  // TEAM SELECTION METHODS
  openTeamPicker(rowIndex: number, colIndex: number): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[colIndex]) return;

    this.selectedSlot = { rowIndex, colIndex };
    this.selectedBingoCell = null;

    // If there's already a team in this slot, offer to remove it
    const currentTeam = this.postRank.rankTable.rows[rowIndex].columns[colIndex].team;
    if (currentTeam) {
      if (confirm(`Replace ${currentTeam.name} with a different team?`)) {
        this.removeTeamFromRanking(rowIndex, colIndex);
      }
    }

    console.log('Selected slot for team assignment:', this.selectedSlot);
  }

  openBingoCellPicker(cellIndex: number): void {
    if (!this.postBingo?.bingoCells[cellIndex]) return;

    this.selectedBingoCell = cellIndex;
    this.selectedSlot = null;

    // If there's already a team in this cell, offer to remove it
    const currentTeam = this.postBingo.bingoCells[cellIndex].team;
    if (currentTeam) {
      if (confirm(`Replace ${currentTeam.name} with a different team?`)) {
        this.removeTeamFromBingo(cellIndex);
      }
    }

    console.log('Selected bingo cell for team assignment:', this.selectedBingoCell);
  }

  assignTeamToSelectedSlot(team: Team): void {
    if (!this.selectedSlot) {
      this.toastr.warning('Please select a ranking position first');
      return;
    }

    const { rowIndex, colIndex } = this.selectedSlot;
    this.assignTeamToRanking(rowIndex, colIndex, team);
    this.selectedSlot = null; // Clear selection after assignment
  }

  assignTeamToSelectedBingoCell(team: Team): void {
    if (this.selectedBingoCell === null) {
      this.toastr.warning('Please select a bingo cell first');
      return;
    }

    this.assignTeamToBingo(this.selectedBingoCell, team);
    this.selectedBingoCell = null; // Clear selection after assignment
  }

  // Team assignment methods
  assignTeamToRanking(rowIndex: number, columnIndex: number, team: Team): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) return;

    // Check if team is already assigned elsewhere
    const alreadyAssigned = this.isTeamAssignedInRanking(team);
    if (alreadyAssigned) {
      this.toastr.warning(`${team.name} is already assigned to another position`);
      return;
    }

    this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = team;
    this.toastr.success(`${team.name} assigned to rank ${rowIndex + 1}`);
  }

  assignTeamToBingo(cellIndex: number, team: Team): void {
    if (!this.postBingo?.bingoCells[cellIndex]) return;

    // Check if team is already assigned elsewhere
    const alreadyAssigned = this.isTeamAssignedInBingo(team);
    if (alreadyAssigned) {
      this.toastr.warning(`${team.name} is already assigned to another cell`);
      return;
    }

    this.postBingo.bingoCells[cellIndex].team = team;
    this.toastr.success(`${team.name} assigned to bingo cell`);
  }

  // Helper methods to check if team is already assigned
  isTeamAssignedInRanking(team: Team): boolean {
    if (!this.postRank?.rankTable?.rows) return false;

    return this.postRank.rankTable.rows.some(row =>
      row.columns.some(col => col.team?.id === team.id)
    );
  }

  isTeamAssignedInBingo(team: Team): boolean {
    if (!this.postBingo?.bingoCells) return false;

    return this.postBingo.bingoCells.some(cell => cell.team?.id === team.id);
  }

  // Remove team assignments
  removeTeamFromRanking(rowIndex: number, columnIndex: number): void {
    if (this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) {
      const teamName = this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team?.name;
      this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = null;
      if (teamName) {
        this.toastr.info(`${teamName} removed from ranking`);
      }
    }
  }

  removeTeamFromBingo(cellIndex: number): void {
    if (this.postBingo?.bingoCells[cellIndex]) {
      const teamName = this.postBingo.bingoCells[cellIndex].team?.name;
      this.postBingo.bingoCells[cellIndex].team = null;
      if (teamName) {
        this.toastr.info(`${teamName} removed from bingo`);
      }
    }
  }

  // Get available teams (not assigned to any position)
  getAvailableTeams(): Team[] {
    const usedTeamIds = new Set<number>();

    if (this.originalPrediction?.predictionType === 'Ranking' && this.postRank) {
      this.postRank.rankTable.rows.forEach(row => {
        row.columns.forEach(col => {
          if (col.team) {
            usedTeamIds.add(col.team.id);
          }
        });
      });
    } else if (this.originalPrediction?.predictionType === 'Bingo' && this.postBingo) {
      this.postBingo.bingoCells.forEach(cell => {
        if (cell.team) {
          usedTeamIds.add(cell.team.id);
        }
      });
    }

    return this.selectedTeams.filter(team => !usedTeamIds.has(team.id));
  }

  // QUICK ACTION METHODS
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
    if (this.originalPrediction?.predictionType === 'Ranking') {
      this.clearAllRankings();
    } else if (this.originalPrediction?.predictionType === 'Bingo') {
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

    if (this.originalPrediction?.predictionType === 'Ranking') {
      this.shuffleRankingTeams(availableTeams);
    } else if (this.originalPrediction?.predictionType === 'Bingo') {
      this.shuffleBingoTeams(availableTeams);
    }
  }

  private shuffleRankingTeams(availableTeams: Team[]): void {
    if (!this.postRank) return;

    // Shuffle the available teams array
    const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);

    // Clear current assignments
    this.clearAllRankings();

    // Assign shuffled teams
    let teamIndex = 0;
    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < shuffled.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < shuffled.length; colIndex++) {
        this.postRank.rankTable.rows[rowIndex].columns[colIndex].team = shuffled[teamIndex++];
      }
    }

    this.toastr.success('Teams shuffled randomly');
  }

  private shuffleBingoTeams(availableTeams: Team[]): void {
    if (!this.postBingo) return;

    // Clear current assignments
    this.clearAllBingo();

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

  // VALIDATION
  isValidCounterPrediction(): boolean {
    if (this.originalPrediction?.predictionType === 'Ranking' && this.postRank) {
      return this.postRank.rankTable.rows.some(row =>
        row.columns.some(col => col.team !== null)
      );
    } else if (this.originalPrediction?.predictionType === 'Bingo' && this.postBingo) {
      return this.postBingo.bingoCells.some(cell => cell.team !== null);
    }
    return false;
  }

  // SUBMIT COUNTER PREDICTION
  async submitCounterPrediction(): Promise<void> {
    if (!this.isValidCounterPrediction()) {
      this.toastr.error('Please make at least some predictions to submit');
      return;
    }

    if (!this.counterPredictionForm.valid) {
      this.toastr.error('Please check your form inputs');
      return;
    }

    this.isSubmitting = true;

    try {
      const counterPredictionData = {
        notes: this.counterPredictionForm.get('notes')?.value || '',
        postRank: this.originalPrediction.predictionType === 'Ranking' ? this.postRank : null,
        postBingo: this.originalPrediction.predictionType === 'Bingo' ? this.postBingo : null
      };

      console.log('Submitting counter prediction:', counterPredictionData);

      const result = await this.counterPredictionService
        .createCounterPrediction(this.originalPrediction.id, counterPredictionData)
        .toPromise();

      this.toastr.success('Counter prediction created successfully!');
      this.showForm.set(false);
      this.resetForm();

      // Update state
      this.canCounterPredict.set(false);
      this.hasExistingCounterPrediction.set(true);

      // Emit event to parent component to refresh
      window.location.reload();

    } catch (error: any) {
      console.error('Error creating counter prediction:', error);

      let errorMessage = 'Failed to create counter prediction';
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      this.toastr.error(errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  // UI HELPERS
  toggleForm(): void {
    this.showForm.update(current => !current);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.counterPredictionForm.reset();
    this.selectedSlot = null;
    this.selectedBingoCell = null;
    this.initializeCounterPrediction();
  }

  // Helper method to get user's current status
  getCounterPredictionStatus(): string {
    if (this.isCheckingEligibility()) {
      return 'Checking eligibility...';
    }

    if (this.hasExistingCounterPrediction()) {
      return 'You have already submitted a counter prediction for this post.';
    }

    if (!this.canCounterPredict()) {
      const currentUser = this.accountService.currentUser();
      if (this.originalPrediction?.author?.id === currentUser?.id) {
        return 'You cannot counter-predict your own prediction.';
      }
      if (this.originalPrediction?.isDraft) {
        return 'Counter predictions are not available for draft predictions.';
      }
      if (!this.originalPrediction?.isActive) {
        return 'This prediction is no longer active.';
      }
      return 'Counter prediction not available.';
    }

    return 'You can create a counter prediction for this post.';
  }

  canShowCounterPredictButton(): boolean {
    return this.canCounterPredict() && !this.isCheckingEligibility();
  }

  // Handle hover effects with proper typing
  onTeamHover(event: Event, isEntering: boolean): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.backgroundColor = isEntering ? '#495057' : 'transparent';
    }
  }
}
