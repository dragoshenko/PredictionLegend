// Replace your existing component with this fixed version

// counter-prediction/counter-prediction.component.ts
import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CreationFlowService } from '../_services/creation-flow.service';
import { PredictionType } from '../_models/predictionType';
import { Team } from '../_models/team';

// Interface definitions for type safety
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

interface BracketMatch {
  order: number;
  leftTeam: Team | null;
  rightTeam: Team | null;
  officialScoreLeftTeam: number;
  officialScoreRightTeam: number;
  score: number;
  isWrong: boolean;
}

interface RootBracket {
  score: number;
  bracketType: string;
  leftTeam: Team | null;
  rightTeam: Team | null;
  brackets: BracketMatch[];
}

interface BingoCell {
  row: number;
  column: number;
  team: Team | null;
  score: number;
  officialScore: number;
  isWrong: boolean;
}

interface PostRankData {
  rankTable: RankTable;
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
}

interface PostBracketData {
  rootBracket: RootBracket;
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
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
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private creationFlowService = inject(CreationFlowService);

  counterPredictionForm: FormGroup = new FormGroup({});
  selectedTeams: Team[] = [];

  // Post structures for different types with proper typing
  postRank: PostRankData | null = null;
  postBracket: PostBracketData | null = null;
  postBingo: PostBingoData | null = null;

  isSubmitting = false;
  showForm = false;

  ngOnInit(): void {
    this.initializeForm();
    if (this.template && this.availableTeams.length > 0) {
      this.initializeCounterPrediction();
    }
  }

  initializeForm(): void {
    this.counterPredictionForm = this.fb.group({
      notes: ['', [Validators.maxLength(500)]],
      isPublic: [true]
    });
  }

  initializeCounterPrediction(): void {
    if (!this.originalPrediction || !this.template) return;

    // Use the same teams as the original prediction
    this.selectedTeams = [...this.availableTeams];

    // Initialize post structure based on prediction type
    switch (this.originalPrediction.predictionType) {
      case PredictionType.Ranking:
        this.initializeCounterRanking();
        break;
      case PredictionType.Bracket:
        this.initializeCounterBracket();
        break;
      case PredictionType.Bingo:
        this.initializeCounterBingo();
        break;
    }
  }

  initializeCounterRanking(): void {
    const numberOfRows = this.template.numberOfRows || 5;
    const numberOfColumns = this.template.numberOfColumns || 1;

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

  initializeCounterBracket(): void {
    const numberOfRounds = this.template.numberOfRounds || 4;

    this.postBracket = {
      rootBracket: {
        score: 0,
        bracketType: this.template.bracketType || 'SingleTeam',
        leftTeam: null,
        rightTeam: null,
        brackets: []
      },
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize bracket structure
    const totalMatches = Math.pow(2, numberOfRounds) - 1;

    for (let i = 0; i < totalMatches; i++) {
      const bracket: BracketMatch = {
        order: i,
        leftTeam: null,
        rightTeam: null,
        officialScoreLeftTeam: 0,
        officialScoreRightTeam: 0,
        score: 0,
        isWrong: false
      };
      this.postBracket.rootBracket.brackets.push(bracket);
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

  // Team assignment methods with null checks
  assignTeamToRanking(rowIndex: number, columnIndex: number, team: Team): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) return;
    this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = team;
  }

  assignTeamToBracket(bracketIndex: number, position: 'left' | 'right', team: Team): void {
    if (!this.postBracket?.rootBracket?.brackets[bracketIndex]) return;

    if (position === 'left') {
      this.postBracket.rootBracket.brackets[bracketIndex].leftTeam = team;
    } else {
      this.postBracket.rootBracket.brackets[bracketIndex].rightTeam = team;
    }
  }

  assignTeamToBingo(cellIndex: number, team: Team): void {
    if (!this.postBingo?.bingoCells[cellIndex]) return;
    this.postBingo.bingoCells[cellIndex].team = team;
  }

  // Remove team assignments
  removeTeamFromRanking(rowIndex: number, columnIndex: number): void {
    if (this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) {
      this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = null;
    }
  }

  removeTeamFromBracket(bracketIndex: number, position: 'left' | 'right'): void {
    if (this.postBracket?.rootBracket?.brackets[bracketIndex]) {
      if (position === 'left') {
        this.postBracket.rootBracket.brackets[bracketIndex].leftTeam = null;
      } else {
        this.postBracket.rootBracket.brackets[bracketIndex].rightTeam = null;
      }
    }
  }

  removeTeamFromBingo(cellIndex: number): void {
    if (this.postBingo?.bingoCells[cellIndex]) {
      this.postBingo.bingoCells[cellIndex].team = null;
    }
  }

  // Validation
  isValidCounterPrediction(): boolean {
    switch (this.originalPrediction?.predictionType) {
      case PredictionType.Ranking:
        return this.isValidRanking();
      case PredictionType.Bracket:
        return this.isValidBracket();
      case PredictionType.Bingo:
        return this.isValidBingo();
      default:
        return false;
    }
  }

  private isValidRanking(): boolean {
    if (!this.postRank?.rankTable?.rows?.[0]?.columns) return false;
    return this.postRank.rankTable.rows[0].columns.some((col: RankColumn) => col.team !== null);
  }

  private isValidBracket(): boolean {
    if (!this.postBracket?.rootBracket?.brackets || !this.template?.numberOfRounds) return false;
    const firstRoundBrackets = this.postBracket.rootBracket.brackets.slice(0, Math.pow(2, this.template.numberOfRounds - 1));
    return firstRoundBrackets.some((bracket: BracketMatch) => bracket.leftTeam && bracket.rightTeam);
  }

  private isValidBingo(): boolean {
    if (!this.postBingo?.bingoCells) return false;
    return this.postBingo.bingoCells.some((cell: BingoCell) => cell.team !== null);
  }

  // Submit counter prediction
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
        originalPredictionId: this.originalPrediction.id,
        templateId: this.template.id,
        predictionType: this.originalPrediction.predictionType,
        notes: this.counterPredictionForm.get('notes')?.value,
        isPublic: this.counterPredictionForm.get('isPublic')?.value,
        postRank: this.originalPrediction.predictionType === PredictionType.Ranking ? this.postRank : null,
        postBracket: this.originalPrediction.predictionType === PredictionType.Bracket ? this.postBracket : null,
        postBingo: this.originalPrediction.predictionType === PredictionType.Bingo ? this.postBingo : null
      };

      const result = await this.creationFlowService.createCounterPrediction(counterPredictionData, this.getCurrentUserId()).toPromise();

      this.toastr.success('Counter prediction created successfully!');
      this.showForm = false;
      this.resetForm();

      // Emit event to parent component to refresh the prediction details
      window.location.reload(); // Simple reload for now

    } catch (error) {
      console.error('Error creating counter prediction:', error);
      this.toastr.error('Failed to create counter prediction');
    } finally {
      this.isSubmitting = false;
    }
  }

  // UI helpers
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.counterPredictionForm.reset();
    this.counterPredictionForm.patchValue({ isPublic: true });
    this.initializeCounterPrediction();
  }

  getAvailableTeams(): Team[] {
    const usedTeams = new Set<number>();

    // Collect used teams based on prediction type
    switch (this.originalPrediction?.predictionType) {
      case PredictionType.Ranking:
        this.postRank?.rankTable?.rows?.forEach((row: RankRow) => {
          row.columns?.forEach((col: RankColumn) => {
            if (col.team) usedTeams.add(col.team.id);
          });
        });
        break;
      case PredictionType.Bracket:
        this.postBracket?.rootBracket?.brackets?.forEach((bracket: BracketMatch) => {
          if (bracket.leftTeam) usedTeams.add(bracket.leftTeam.id);
          if (bracket.rightTeam) usedTeams.add(bracket.rightTeam.id);
        });
        break;
      case PredictionType.Bingo:
        this.postBingo?.bingoCells?.forEach((cell: BingoCell) => {
          if (cell.team) usedTeams.add(cell.team.id);
        });
        break;
    }

    return this.selectedTeams.filter(team => !usedTeams.has(team.id));
  }

  private getCurrentUserId(): number {
    // Get from auth service
    return 1; // Mock for now
  }

  // Helper methods for templates
  getBingoCell(row: number, col: number): BingoCell | undefined {
    return this.postBingo?.bingoCells?.find((cell: BingoCell) => cell.row === row && cell.column === col);
  }

  getBracketByRound(round: number): BracketMatch[] {
    if (!this.postBracket?.rootBracket?.brackets || !this.template?.numberOfRounds) {
      return [];
    }

    const bracketsPerRound = Math.pow(2, this.template.numberOfRounds - round);
    const startIndex = Math.pow(2, this.template.numberOfRounds) - Math.pow(2, this.template.numberOfRounds - round + 1);

    return this.postBracket.rootBracket.brackets.slice(startIndex, startIndex + bracketsPerRound);
  }



  private assignTeamToFirstAvailableSlot(team: Team): void {
    switch (this.originalPrediction?.predictionType) {
      case PredictionType.Ranking:
        // Find first empty slot in ranking
        if (!this.postRank?.rankTable?.rows) {
          this.toastr.warning('Ranking structure not initialized');
          return;
        }

        for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length; rowIndex++) {
          for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length; colIndex++) {
            if (!this.postRank.rankTable.rows[rowIndex].columns[colIndex].team) {
              this.assignTeamToRanking(rowIndex, colIndex, team);
              return;
            }
          }
        }
        break;

      case PredictionType.Bracket:
        // Find first empty bracket position
        if (!this.postBracket?.rootBracket?.brackets) {
          this.toastr.warning('Bracket structure not initialized');
          return;
        }

        for (let bracketIndex = 0; bracketIndex < this.postBracket.rootBracket.brackets.length; bracketIndex++) {
          const bracket = this.postBracket.rootBracket.brackets[bracketIndex];
          if (!bracket.leftTeam) {
            this.assignTeamToBracket(bracketIndex, 'left', team);
            return;
          } else if (!bracket.rightTeam) {
            this.assignTeamToBracket(bracketIndex, 'right', team);
            return;
          }
        }
        break;

      case PredictionType.Bingo:
        // Find first empty bingo cell
        if (!this.postBingo?.bingoCells) {
          this.toastr.warning('Bingo structure not initialized');
          return;
        }

        for (let cellIndex = 0; cellIndex < this.postBingo.bingoCells.length; cellIndex++) {
          if (!this.postBingo.bingoCells[cellIndex].team) {
            this.assignTeamToBingo(cellIndex, team);
            return;
          }
        }
        break;
    }

    this.toastr.warning('No available positions for this team');
  }

  // Auto-fill methods for quick setup with proper null checks
  autoFillRanking(): void {
    if (!this.postRank?.rankTable?.rows) {
      this.toastr.error('Ranking structure not initialized');
      return;
    }

    const availableTeams = this.getAvailableTeams();
    let teamIndex = 0;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < availableTeams.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < availableTeams.length; colIndex++) {
        if (!this.postRank.rankTable.rows[rowIndex].columns[colIndex].team) {
          this.assignTeamToRanking(rowIndex, colIndex, availableTeams[teamIndex++]);
        }
      }
    }

    this.toastr.info(`Auto-filled ${teamIndex} positions`);
  }

  autoFillBracket(): void {
    if (!this.postBracket?.rootBracket?.brackets) {
      this.toastr.error('Bracket structure not initialized');
      return;
    }

    const availableTeams = this.getAvailableTeams();
    const firstRoundBrackets = this.getBracketByRound(1);
    let teamIndex = 0;

    for (let bracketIndex = 0; bracketIndex < firstRoundBrackets.length && teamIndex < availableTeams.length; bracketIndex++) {
      const bracket = firstRoundBrackets[bracketIndex];
      if (!bracket.leftTeam && teamIndex < availableTeams.length) {
        this.assignTeamToBracket(bracketIndex, 'left', availableTeams[teamIndex++]);
      }
      if (!bracket.rightTeam && teamIndex < availableTeams.length) {
        this.assignTeamToBracket(bracketIndex, 'right', availableTeams[teamIndex++]);
      }
    }

    this.toastr.info(`Auto-filled ${teamIndex} bracket positions`);
  }

  autoFillBingo(): void {
    if (!this.postBingo?.bingoCells) {
      this.toastr.error('Bingo structure not initialized');
      return;
    }

    const availableTeams = this.getAvailableTeams();
    const emptyCells = this.postBingo.bingoCells
      .map((cell: BingoCell, index: number) => ({ cell, index }))
      .filter(({ cell }) => !cell.team);

    // Randomly select cells to fill
    const cellsToFill = Math.min(availableTeams.length, emptyCells.length);
    const randomCells = emptyCells.sort(() => 0.5 - Math.random()).slice(0, cellsToFill);

    randomCells.forEach(({ index }, teamIndex) => {
      if (teamIndex < availableTeams.length) {
        this.assignTeamToBingo(index, availableTeams[teamIndex]);
      }
    });

    this.toastr.info(`Auto-filled ${cellsToFill} bingo squares`);
  }
  showTeamAssignmentOptions(position: any): void {
    const availableTeams = this.getAvailableTeams();

    if (availableTeams.length === 0) {
      this.toastr.warning('No available teams to assign');
      return;
    }

    // For now, assign the first available team
    // In the future, this could open a modal to let user choose
    const teamToAssign = availableTeams[0];

    if (position?.rowIndex !== undefined && position?.colIndex !== undefined) {
      // Ranking assignment
      this.assignTeamToRanking(position.rowIndex, position.colIndex, teamToAssign);
    } else if (position?.bracketIndex !== undefined && position?.position) {
      // Bracket assignment
      this.assignTeamToBracket(position.bracketIndex, position.position, teamToAssign);
    } else if (position?.cellIndex !== undefined) {
      // Bingo assignment
      this.assignTeamToBingo(position.cellIndex, teamToAssign);
    } else {
      // Fallback to auto-assignment
      this.assignTeamToFirstAvailableSlot(teamToAssign);
    }
  }
}
