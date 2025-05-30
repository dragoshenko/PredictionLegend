// client/src/app/counter-prediction/counter-prediction.component.ts
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

  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForm();
    this.checkCounterPredictEligibility();

    if (this.template && this.availableTeams.length > 0) {
      this.initializeCounterPrediction();
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
      console.error('Error checking counter prediction eligibility:', error);
      this.canCounterPredict.set(false);
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
        this.initializeCounterRanking();
        break;
      case 'Bingo':
      case PredictionType.Bingo:
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

  // Team assignment methods
  assignTeamToRanking(rowIndex: number, columnIndex: number, team: Team): void {
    if (!this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) return;
    this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = team;
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

  removeTeamFromBingo(cellIndex: number): void {
    if (this.postBingo?.bingoCells[cellIndex]) {
      this.postBingo.bingoCells[cellIndex].team = null;
    }
  }

  // Validation
  isValidCounterPrediction(): boolean {
    switch (this.originalPrediction?.predictionType) {
      case 'Ranking':
      case PredictionType.Ranking:
        return this.isValidRanking();
      case 'Bingo':
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

  // UI helpers
  toggleForm(): void {
    this.showForm.update(current => !current);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.counterPredictionForm.reset();
    this.initializeCounterPrediction();
  }

  getAvailableTeams(): Team[] {
    const usedTeams = new Set<number>();

    // Collect used teams based on prediction type
    switch (this.originalPrediction?.predictionType) {
      case 'Ranking':
      case PredictionType.Ranking:
        this.postRank?.rankTable?.rows?.forEach((row: RankRow) => {
          row.columns?.forEach((col: RankColumn) => {
            if (col.team) usedTeams.add(col.team.id);
          });
        });
        break;
      case 'Bingo':
      case PredictionType.Bingo:
        this.postBingo?.bingoCells?.forEach((cell: BingoCell) => {
          if (cell.team) usedTeams.add(cell.team.id);
        });
        break;
    }

    return this.selectedTeams.filter(team => !usedTeams.has(team.id));
  }

  showTeamAssignmentOptions(position: any): void {
    const availableTeams = this.getAvailableTeams();

    if (availableTeams.length === 0) {
      this.toastr.warning('No available teams to assign');
      return;
    }

    // For now, assign the first available team
    const teamToAssign = availableTeams[0];

    if (position?.rowIndex !== undefined && position?.colIndex !== undefined) {
      // Ranking assignment
      this.assignTeamToRanking(position.rowIndex, position.colIndex, teamToAssign);
    } else if (position?.cellIndex !== undefined) {
      // Bingo assignment
      this.assignTeamToBingo(position.cellIndex, teamToAssign);
    }

    this.toastr.success(`${teamToAssign.name} assigned successfully`);
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
}
