// Enhanced counter-prediction.component.ts with fixed team ordering and null safety
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

  // Team selection state - ENHANCED
  selectedSlot: { rowIndex: number; colIndex: number } | null = null;
  selectedBingoCell: number | null = null;

  // UI state for team selection
  isSelectingTeam = false;
  showTeamPicker = false;

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

      const canCounterPredict = await this.counterPredictionService
        .canUserCounterPredict(this.originalPrediction.id)
        .toPromise();

      this.canCounterPredict.set(canCounterPredict || false);

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
      // If the API call fails, let's try to determine eligibility on the frontend
      const currentUser = this.accountService.currentUser();
      if (currentUser && this.originalPrediction) {
        const canCounterPredict =
          this.originalPrediction.userId !== currentUser.id && // Not own prediction
          !this.originalPrediction.isDraft && // Not draft
          this.originalPrediction.isActive && // Is active
          this.availableTeams.length > 0; // Has teams

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
    if (!this.originalPrediction || !this.template) {

      this.toastr.warning('Missing prediction or template data');
      return;
    }

    // Use the same teams as the original prediction
    this.selectedTeams = [...this.availableTeams];

    // Initialize post structure based on prediction type
    const predType = this.originalPrediction.predictionType;
    if (predType === 'Ranking' || predType === 0 || predType === '0') {
      this.initializeCounterRanking();
    } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
      this.initializeCounterBingo();
    } else if (predType === 'Bracket' || predType === 1 || predType === '1') {
      this.toastr.info('Bracket counter predictions will be available soon');
    } else {
      this.toastr.warning(`Unsupported prediction type: ${this.originalPrediction.predictionType}`);
    }

  }

  initializeCounterRanking(): void {
    const numberOfRows = this.template?.numberOfRows || 5;
    const numberOfColumns = this.template?.numberOfColumns || 1;

    this.postRank = {
      rankingTemplateId: this.template?.id || 0,
      predictionId: this.originalPrediction?.id || 0,
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

  // ENHANCED TEAM SELECTION METHODS
  openTeamPicker(rowIndex: number, colIndex: number): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[colIndex]) {
      this.toastr.warning('Invalid slot selected');
      return;
    }

    this.selectedSlot = { rowIndex, colIndex };
    this.selectedBingoCell = null;
    this.showTeamPicker = true;
    this.isSelectingTeam = true;

    this.toastr.info(`Select a team for Rank ${rowIndex + 1}`);
  }

  openBingoCellPicker(cellIndex: number): void {
    if (!this.postBingo?.bingoCells[cellIndex]) {
      this.toastr.warning('Invalid cell selected');
      return;
    }

    this.selectedBingoCell = cellIndex;
    this.selectedSlot = null;
    this.showTeamPicker = true;
    this.isSelectingTeam = true;

    this.toastr.info('Select a team for this bingo square');
  }

  // ENHANCED TEAM ASSIGNMENT METHODS
  selectTeamForSlot(team: Team): void {
    if (this.selectedSlot) {
      this.assignTeamToRanking(this.selectedSlot.rowIndex, this.selectedSlot.colIndex, team);
    } else if (this.selectedBingoCell !== null) {
      this.assignTeamToBingo(this.selectedBingoCell, team);
    } else {
      this.toastr.warning('Please select a position first');
      return;
    }

    // Clear selection and hide picker
    this.clearSelection();
  }

  assignTeamToRanking(rowIndex: number, columnIndex: number, team: Team): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) {
      this.toastr.error('Invalid ranking position');
      return;
    }

    // Check if team is already assigned elsewhere
    const existingPosition = this.findTeamInRanking(team);
    if (existingPosition) {
      if (confirm(`${team.name} is already assigned to Rank ${existingPosition.rowIndex + 1}. Move it to Rank ${rowIndex + 1}?`)) {
        // Remove from old position
        this.removeTeamFromRanking(existingPosition.rowIndex, existingPosition.columnIndex);
      } else {
        return;
      }
    }

    // Assign team to new position
    this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = team;
    this.toastr.success(`${team.name} assigned to Rank ${rowIndex + 1}`);
  }

  assignTeamToBingo(cellIndex: number, team: Team): void {
    if (!this.postBingo?.bingoCells[cellIndex]) {
      this.toastr.error('Invalid bingo cell');
      return;
    }

    // Check if team is already assigned elsewhere
    const existingCellIndex = this.findTeamInBingo(team);
    if (existingCellIndex !== -1) {
      if (confirm(`${team.name} is already assigned to another cell. Move it to this cell?`)) {
        // Remove from old cell
        this.removeTeamFromBingo(existingCellIndex);
      } else {
        return;
      }
    }

    // Assign team to new cell
    this.postBingo.bingoCells[cellIndex].team = team;
    this.toastr.success(`${team.name} assigned to bingo cell`);
  }

  // HELPER METHODS TO FIND TEAMS
  findTeamInRanking(team: Team): { rowIndex: number; columnIndex: number } | null {
    if (!this.postRank?.rankTable?.rows) return null;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length; colIndex++) {
        if (this.postRank.rankTable.rows[rowIndex].columns[colIndex].team?.id === team.id) {
          return { rowIndex, columnIndex: colIndex };
        }
      }
    }

    return null;
  }

  findTeamInBingo(team: Team): number {
    if (!this.postBingo?.bingoCells) return -1;

    return this.postBingo.bingoCells.findIndex(cell => cell.team?.id === team.id);
  }

  // REMOVE TEAM ASSIGNMENTS
  removeTeamFromRanking(rowIndex: number, columnIndex: number): void {
    if (this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) {
      const teamName = this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team?.name;
      this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = null;
      if (teamName) {
        this.toastr.info(`${teamName} removed from Rank ${rowIndex + 1}`);
      }
    }
  }

  removeTeamFromBingo(cellIndex: number): void {
    if (this.postBingo?.bingoCells[cellIndex]) {
      const teamName = this.postBingo.bingoCells[cellIndex].team?.name;
      this.postBingo.bingoCells[cellIndex].team = null;
      if (teamName) {
        this.toastr.info(`${teamName} removed from bingo cell`);
      }
    }
  }

  // CLEAR SELECTION
  clearSelection(): void {
    this.selectedSlot = null;
    this.selectedBingoCell = null;
    this.showTeamPicker = false;
    this.isSelectingTeam = false;
  }

  // GET AVAILABLE TEAMS (not assigned to any position)
  getAvailableTeams(): Team[] {
    const usedTeamIds = new Set<number>();

    const predType = this.originalPrediction?.predictionType;
    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank) {
      this.postRank.rankTable.rows.forEach(row => {
        row.columns.forEach(col => {
          if (col.team) {
            usedTeamIds.add(col.team.id);
          }
        });
      });
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo) {
      this.postBingo.bingoCells.forEach(cell => {
        if (cell.team) {
          usedTeamIds.add(cell.team.id);
        }
      });
    }

    return this.selectedTeams.filter(team => !usedTeamIds.has(team.id));
  }

  // GET ASSIGNED TEAMS (for display purposes)
  getAssignedTeams(): Team[] {
    const assignedTeamIds = new Set<number>();

    const predType = this.originalPrediction?.predictionType;
    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank) {
      this.postRank.rankTable.rows.forEach(row => {
        row.columns.forEach(col => {
          if (col.team) {
            assignedTeamIds.add(col.team.id);
          }
        });
      });
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo) {
      this.postBingo.bingoCells.forEach(cell => {
        if (cell.team) {
          assignedTeamIds.add(cell.team.id);
        }
      });
    }

    return this.selectedTeams.filter(team => assignedTeamIds.has(team.id));
  }

  // ENHANCED QUICK ACTION METHODS
  autoFillPrediction(): void {
    const predType = this.originalPrediction?.predictionType;
    if (predType === 'Ranking' || predType === 0 || predType === '0') {
      this.autoFillRanking();
    } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
      this.autoFillBingo();
    } else {
      this.toastr.warning('Auto-fill not supported for this prediction type');
    }
  }

  smartFillPrediction(): void {
    const predType = this.originalPrediction?.predictionType;
    if (predType === 'Ranking' || predType === 0 || predType === '0') {
      this.smartFillRanking();
    } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
      this.smartFillBingo();
    } else {
      this.toastr.warning('Smart fill not supported for this prediction type');
    }
  }

  autoFillRanking(): void {
    if (!this.postRank) return;

    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) {
      this.toastr.warning('No teams available to assign');
      return;
    }

    let teamIndex = 0;
    let assignedCount = 0;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < availableTeams.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < availableTeams.length; colIndex++) {
        const slot = this.postRank.rankTable.rows[rowIndex].columns[colIndex];
        if (!slot.team) {
          slot.team = availableTeams[teamIndex++];
          assignedCount++;
        }
      }
    }

    this.toastr.success(`Auto-filled ${assignedCount} positions`, 'Ranking Complete');
  }

  autoFillBingo(): void {
    if (!this.postBingo) return;

    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) {
      this.toastr.warning('No teams available to assign');
      return;
    }

    const emptyCells = this.postBingo.bingoCells.filter(cell => !cell.team);
    const cellsToFill = Math.min(availableTeams.length, emptyCells.length);

    // Randomly select cells to fill for better bingo distribution
    const shuffledCells = [...emptyCells].sort(() => 0.5 - Math.random()).slice(0, cellsToFill);

    shuffledCells.forEach((cell, index) => {
      if (index < availableTeams.length) {
        cell.team = availableTeams[index];
      }
    });

    this.toastr.success(`Auto-filled ${cellsToFill} bingo squares`, 'Bingo Complete');
  }

  // Smart fill tries to be more strategic about placement
  smartFillRanking(): void {
    if (!this.postRank) return;

    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) {
      this.toastr.warning('No teams available to assign');
      return;
    }

    // Sort teams alphabetically for consistent placement
    const sortedTeams = [...availableTeams].sort((a, b) => a.name.localeCompare(b.name));

    let teamIndex = 0;
    let assignedCount = 0;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < sortedTeams.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < sortedTeams.length; colIndex++) {
        const slot = this.postRank.rankTable.rows[rowIndex].columns[colIndex];
        if (!slot.team) {
          slot.team = sortedTeams[teamIndex++];
          assignedCount++;
        }
      }
    }

    this.toastr.success(`Smart-filled ${assignedCount} positions alphabetically`, 'Strategic Ranking');
  }

  smartFillBingo(): void {
    if (!this.postBingo) return;

    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) {
      this.toastr.warning('No teams available to assign');
      return;
    }

    const emptyCells = this.postBingo.bingoCells.filter(cell => !cell.team);

    // For bingo, try to distribute teams in a pattern (corners first, then edges, then center)
    const gridSize = this.postBingo.gridSize;
    const cornerCells = emptyCells.filter(cell =>
      (cell.row === 0 || cell.row === gridSize - 1) &&
      (cell.column === 0 || cell.column === gridSize - 1)
    );

    const edgeCells = emptyCells.filter(cell =>
      !cornerCells.includes(cell) &&
      (cell.row === 0 || cell.row === gridSize - 1 || cell.column === 0 || cell.column === gridSize - 1)
    );

    const centerCells = emptyCells.filter(cell =>
      !cornerCells.includes(cell) && !edgeCells.includes(cell)
    );

    // Sort teams by name for consistent placement
    const sortedTeams = [...availableTeams].sort((a, b) => a.name.localeCompare(b.name));

    let teamIndex = 0;
    let assignedCount = 0;

    // Fill corners first
    for (const cell of cornerCells.slice(0, Math.min(sortedTeams.length - teamIndex, cornerCells.length))) {
      if (teamIndex < sortedTeams.length) {
        cell.team = sortedTeams[teamIndex++];
        assignedCount++;
      }
    }

    // Then edges
    for (const cell of edgeCells.slice(0, Math.min(sortedTeams.length - teamIndex, edgeCells.length))) {
      if (teamIndex < sortedTeams.length) {
        cell.team = sortedTeams[teamIndex++];
        assignedCount++;
      }
    }

    // Finally center
    for (const cell of centerCells.slice(0, Math.min(sortedTeams.length - teamIndex, centerCells.length))) {
      if (teamIndex < sortedTeams.length) {
        cell.team = sortedTeams[teamIndex++];
        assignedCount++;
      }
    }

    this.toastr.success(`Smart-filled ${assignedCount} squares strategically`, 'Strategic Bingo');
  }

  clearAll(): void {
    const predType = this.originalPrediction?.predictionType;
    if (predType === 'Ranking' || predType === 0 || predType === '0') {
      this.clearAllRankings();
    } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
      this.clearAllBingo();
    }
    this.clearSelection();
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

    const predType = this.originalPrediction?.predictionType;
    if (predType === 'Ranking' || predType === 0 || predType === '0') {
      this.shuffleRankingTeams(availableTeams);
    } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
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

  // Helper method to check if prediction type is recognized
  isRecognizedPredictionType(): boolean {
    const predType = this.originalPrediction?.predictionType;
    return (predType === 'Ranking' || predType === 0 || predType === '0') ||
           (predType === 'Bingo' || predType === 2 || predType === '2') ||
           (predType === 'Bracket' || predType === 1 || predType === '1');
  }

  // Helper method to determine if ranking should be shown
  shouldShowRanking(): boolean {
    const predType = this.originalPrediction?.predictionType;
    const isRankingType = (predType === 'Ranking' || predType === 0 || predType === '0');
    const hasPostRank = !!this.postRank;
    const hasRankTable = !!this.postRank?.rankTable;
    const hasRows = (this.postRank?.rankTable?.rows?.length || 0) > 0;


    return isRankingType && hasPostRank && hasRankTable && hasRows;
  }

  // VALIDATION - Only allow submission at 100%
  isValidCounterPrediction(): boolean {
    const predType = this.originalPrediction?.predictionType;

    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank?.rankTable?.rows) {
      // For ranking: ALL positions must be filled
      const totalSlots = this.postRank.rankTable.numberOfRows * this.postRank.rankTable.numberOfColumns;
      const filledSlots = this.postRank.rankTable.rows.reduce((count, row) => {
        return count + row.columns.filter(col => col.team !== null).length;
      }, 0);

      return filledSlots === totalSlots && totalSlots > 0;
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo?.bingoCells) {
      // For bingo: ALL cells must be filled
      const totalCells = this.postBingo.bingoCells.length;
      const filledCells = this.postBingo.bingoCells.filter(cell => cell.team !== null).length;

      return filledCells === totalCells && totalCells > 0;
    }

    return false;
  }

  // Get completion percentage (already exists but ensuring it's accurate)
  getCompletionPercentage(): number {
    const predType = this.originalPrediction?.predictionType;

    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank?.rankTable?.rows) {
      const totalSlots = this.postRank.rankTable.numberOfRows * this.postRank.rankTable.numberOfColumns;
      const filledSlots = this.postRank.rankTable.rows.reduce((count, row) => {
        return count + row.columns.filter(col => col.team !== null).length;
      }, 0);

      return totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo?.bingoCells) {
      const totalCells = this.postBingo.bingoCells.length;
      const filledCells = this.postBingo.bingoCells.filter(cell => cell.team !== null).length;

      return totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
    }

    return 0;
  }

  async submitCounterPrediction(): Promise<void> {
    const completionPercentage = this.getCompletionPercentage();

    if (completionPercentage < 100) {
      this.toastr.error(`Please fill all positions before submitting (${completionPercentage}% complete)`);
      return;
    }

    if (!this.isValidCounterPrediction()) {
      this.toastr.error('Please complete your prediction before submitting');
      return;
    }

    if (!this.counterPredictionForm.valid) {
      this.toastr.error('Please check your form inputs');
      return;
    }

    this.isSubmitting = true;

    try {
      const predType = this.originalPrediction.predictionType;
      let counterPredictionData: any = {
        notes: this.counterPredictionForm.get('notes')?.value || ''
      };

      // Add the appropriate post data based on prediction type
      if (predType === 'Ranking' || predType === 0 || predType === '0') {
        if (!this.postRank) {
          throw new Error('PostRank data is missing');
        }
        counterPredictionData.postRank = this.postRank;
      } else if (predType === 'Bingo' || predType === 2 || predType === '2') {
        if (!this.postBingo) {
          throw new Error('PostBingo data is missing');
        }
        counterPredictionData.postBingo = this.postBingo;
      } else {
        throw new Error(`Unsupported prediction type: ${predType}`);
      }

      // Validate the data structure before sending
      if (counterPredictionData.postRank) {

        // Count assigned teams
        let assignedCount = 0;
        if (counterPredictionData.postRank.rankTable?.rows) {
          counterPredictionData.postRank.rankTable.rows.forEach((row: any) => {
            row.columns?.forEach((col: any) => {
              if (col.team) assignedCount++;
            });
          });
        }
      }

      if (counterPredictionData.postBingo) {

        // Count assigned teams
        const assignedCells = counterPredictionData.postBingo.bingoCells?.filter((cell: any) => cell.team) || [];
      }
      counterPredictionData.id = this.originalPrediction.id;
      // Make the API call
      const result = await this.counterPredictionService
        .createCounterPrediction(counterPredictionData)
        .toPromise();

      this.toastr.success('Counter prediction created successfully!');
      this.showForm.set(false);
      this.resetForm();

      // Update state
      this.canCounterPredict.set(false);
      this.hasExistingCounterPrediction.set(true);

      // Refresh the page to show the new counter prediction
      window.location.reload();

    } catch (error: any) {

      let errorMessage = 'Failed to create counter prediction';

      // Enhanced error handling
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your selections.';
      } else if (error?.status === 401) {
        errorMessage = 'You are not authorized to create this counter prediction.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
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
    this.clearSelection();
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

  // Check if a team is currently selected in the UI
  isTeamSelected(team: Team): boolean {
    const predType = this.originalPrediction?.predictionType;
    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank) {
      return this.findTeamInRanking(team) !== null;
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo) {
      return this.findTeamInBingo(team) !== -1;
    }
    return false;
  }

  // Get the position where a team is assigned (for display purposes)
  getTeamPosition(team: Team): string {
    const predType = this.originalPrediction?.predictionType;
    if ((predType === 'Ranking' || predType === 0 || predType === '0') && this.postRank) {
      const position = this.findTeamInRanking(team);
      if (position) {
        return `Rank ${position.rowIndex + 1}`;
      }
    } else if ((predType === 'Bingo' || predType === 2 || predType === '2') && this.postBingo) {
      const cellIndex = this.findTeamInBingo(team);
      if (cellIndex !== -1) {
        const cell = this.postBingo.bingoCells[cellIndex];
        return `Cell (${cell.row + 1}, ${cell.column + 1})`;
      }
    }
    return '';
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (this.selectedTeams.length === 0) return 0;
    return Math.round((this.getAssignedTeams().length / this.selectedTeams.length) * 100);
  }

  // Safe getter methods for template usage
  getPostRankRows(): RankRow[] {
    return this.postRank?.rankTable?.rows || [];
  }

  getFirstRowColumns(): RankColumn[] {
    const rows = this.getPostRankRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getBingoCells(): BingoCell[] {
    return this.postBingo?.bingoCells || [];
  }

  getGridSize(): number {
    return this.postBingo?.gridSize || 5;
  }
}
