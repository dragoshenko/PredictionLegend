// create-post/create-post.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../_models/team';
import { PostRank } from '../_models/postRank';
import { PostBracket } from '../_models/postBracket';
import { PostBingo } from '../_models/postBingo';
import { PredictionType } from '../_models/predictionType';
import { PredictionService } from '../_services/prediction.service';
import { ToastrService } from 'ngx-toastr';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

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
  selector: 'app-create-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private predictionService = inject(PredictionService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  predictionId: number = 0;
  templateId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;
  template: any = null;
  selectedTeams: Team[] = [];

  // Post data structures with proper typing
  postRank: PostRankData | null = null;
  postBracket: PostBracketData | null = null;
  postBingo: PostBingoData | null = null;

  // Forms
  postForm: FormGroup = new FormGroup({});

  // UI State
  isLoading = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadRouteData();
    this.initializePostStructure();
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

    // Get selected teams from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['selectedTeams']) {
      this.selectedTeams = navigation.extras.state['selectedTeams'];
    } else {
      // Fallback: redirect back to team selection
      this.router.navigate(['/select-teams', this.predictionId, this.templateId, this.predictionType]);
    }
  }

  initializePostStructure(): void {
    switch (this.predictionType) {
      case PredictionType.Ranking:
        this.initializeRankingPost();
        break;
      case PredictionType.Bracket:
        this.initializeBracketPost();
        break;
      case PredictionType.Bingo:
        this.initializeBingoPost();
        break;
    }
  }

  initializeRankingPost(): void {
    // Create ranking structure based on template
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

    // Initialize empty rows with proper typing
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

  initializeBracketPost(): void {
    const numberOfRounds = this.template?.numberOfRounds || 4;
    const totalParticipants = Math.pow(2, numberOfRounds);

    this.postBracket = {
      rootBracket: {
        score: 0,
        bracketType: this.template?.bracketType || 'SingleTeam',
        leftTeam: null,
        rightTeam: null,
        brackets: []
      },
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize bracket structure with proper typing
    this.generateBracketStructure(numberOfRounds);
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

    // Initialize bingo cells with proper typing
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

  generateBracketStructure(rounds: number): void {
    // Generate tournament bracket structure
    const totalMatches = Math.pow(2, rounds) - 1;

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
      this.postBracket!.rootBracket.brackets.push(bracket);
    }

    // Initialize first round with teams if available
    const firstRoundMatches = Math.pow(2, rounds - 1);
    for (let i = 0; i < firstRoundMatches && i < this.selectedTeams.length / 2; i++) {
      const bracket = this.postBracket!.rootBracket.brackets[i];
      bracket.leftTeam = this.selectedTeams[i * 2] || null;
      bracket.rightTeam = this.selectedTeams[i * 2 + 1] || null;
    }
  }

  // Drag & Drop for Rankings
  dropTeamInRanking(event: CdkDragDrop<any[]>, rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    if (event.previousContainer === event.container) {
      // Moving within same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between containers
      if (event.previousContainer.data === this.selectedTeams) {
        // From available teams to ranking position
        const team = this.selectedTeams[event.previousIndex];
        if (this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex]) {
          this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = team;
        }
      }
    }
  }

  // Team assignment for Bingo
  assignTeamToBingo(cellIndex: number, team: Team): void {
    if (!this.postBingo || !this.postBingo.bingoCells[cellIndex]) return;
    this.postBingo.bingoCells[cellIndex].team = team;
  }

  // Team assignment for Bracket
  assignTeamToBracket(bracketIndex: number, position: 'left' | 'right', team: Team): void {
    if (!this.postBracket || !this.postBracket.rootBracket.brackets[bracketIndex]) return;

    if (position === 'left') {
      this.postBracket.rootBracket.brackets[bracketIndex].leftTeam = team;
    } else {
      this.postBracket.rootBracket.brackets[bracketIndex].rightTeam = team;
    }
  }

  // Remove team from position with proper typing
  removeTeamFromPosition(type: 'rank' | 'bracket' | 'bingo', ...args: any[]): void {
    switch (type) {
      case 'rank':
        const [rowIndex, columnIndex] = args;
        if (this.postRank?.rankTable?.rows[rowIndex]?.columns[columnIndex]) {
          this.postRank.rankTable.rows[rowIndex].columns[columnIndex].team = null;
        }
        break;
      case 'bracket':
        const [bracketIndex, position] = args;
        if (this.postBracket?.rootBracket?.brackets[bracketIndex]) {
          if (position === 'left') {
            this.postBracket.rootBracket.brackets[bracketIndex].leftTeam = null;
          } else {
            this.postBracket.rootBracket.brackets[bracketIndex].rightTeam = null;
          }
        }
        break;
      case 'bingo':
        const [cellIndex] = args;
        if (this.postBingo?.bingoCells[cellIndex]) {
          this.postBingo.bingoCells[cellIndex].team = null;
        }
        break;
    }
  }

  // Validation
  isValidPost(): boolean {
    switch (this.predictionType) {
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

  isValidRanking(): boolean {
    // Check if at least first row has teams
    return this.postRank?.rankTable?.rows[0]?.columns?.some((col: RankColumn) => col.team !== null) || false;
  }

  isValidBracket(): boolean {
    // Check if first round has enough teams
    const firstRoundBrackets = this.postBracket?.rootBracket?.brackets?.slice(0, Math.pow(2, this.template?.numberOfRounds - 1)) || [];
    return firstRoundBrackets.some((bracket: BracketMatch) => bracket.leftTeam && bracket.rightTeam);
  }

  isValidBingo(): boolean {
    // Check if at least one cell has a team
    return this.postBingo?.bingoCells?.some((cell: BingoCell) => cell.team !== null) || false;
  }

  // Submit post
  async submitPost(): Promise<void> {
    if (!this.isValidPost()) {
      this.toastr.error('Please assign teams to at least some positions');
      return;
    }

    this.isSubmitting = true;
    try {
      const postData = {
        predictionId: this.predictionId,
        templateId: this.templateId,
        isDraft: this.postForm.get('isDraft')?.value,
        notes: this.postForm.get('notes')?.value,
        postRank: this.predictionType === PredictionType.Ranking ? this.postRank : null,
        postBracket: this.predictionType === PredictionType.Bracket ? this.postBracket : null,
        postBingo: this.predictionType === PredictionType.Bingo ? this.postBingo : null
      };

      // Call API to create post
      const result = await this.createPost(postData);

      this.toastr.success('Prediction post created successfully!');
      this.router.navigate(['/prediction', this.predictionId]);

    } catch (error) {
      console.error('Error creating post:', error);
      this.toastr.error('Failed to create prediction post');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async createPost(postData: any): Promise<any> {
    // This would call your API service
    // return this.predictionService.createPost(postData);
    return new Promise(resolve => setTimeout(resolve, 1000)); // Mock for now
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/select-teams', this.predictionId, this.templateId, this.predictionType]);
  }

  abandonFlow(): void {
    if (confirm('Are you sure you want to abandon this prediction? All progress will be lost.')) {
      // Call abandonment service
      this.router.navigate(['/']);
    }
  }

  // Helper methods
  getAvailableTeams(): Team[] {
    const usedTeams = new Set<number>();

    switch (this.predictionType) {
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

  getBingoCell(row: number, col: number): BingoCell | undefined {
    return this.postBingo?.bingoCells?.find((cell: BingoCell) => cell.row === row && cell.column === col);
  }

  getBracketByRound(round: number): BracketMatch[] {
    const bracketsPerRound = Math.pow(2, this.template?.numberOfRounds - round);
    const startIndex = Math.pow(2, this.template?.numberOfRounds) - Math.pow(2, this.template?.numberOfRounds - round + 1);

    return this.postBracket?.rootBracket?.brackets?.slice(startIndex, startIndex + bracketsPerRound) || [];
  }
  // Add these helper methods to your CreatePostComponent class

/**
 * Find the first empty cell index in the bingo grid
 */
getFirstEmptyBingoIndex(): number {
  if (!this.postBingo?.bingoCells) return -1;
  return this.postBingo.bingoCells.findIndex((cell: BingoCell) => !cell.team);
}

/**
 * Get a random side for bracket assignment
 */
getRandomSide(): 'left' | 'right' {
  return Math.random() > 0.5 ? 'left' : 'right';
}

/**
 * Quick assign team to first available bingo cell
 */
quickAssignToBingo(team: Team): void {
  const emptyIndex = this.getFirstEmptyBingoIndex();
  if (emptyIndex >= 0) {
    this.assignTeamToBingo(emptyIndex, team);
  }
}

/**
 * Quick assign team to first available bracket position
 */
quickAssignToBracket(team: Team): void {
  if (!this.postBracket?.rootBracket?.brackets) return;

  // Find first round brackets that need teams
  const firstRoundSize = Math.pow(2, (this.template?.numberOfRounds || 4) - 1);
  const firstRoundBrackets = this.postBracket.rootBracket.brackets.slice(0, firstRoundSize);

  // Find first bracket with an empty slot
  for (let i = 0; i < firstRoundBrackets.length; i++) {
    const bracket = firstRoundBrackets[i];
    if (!bracket.leftTeam) {
      this.assignTeamToBracket(i, 'left', team);
      return;
    } else if (!bracket.rightTeam) {
      this.assignTeamToBracket(i, 'right', team);
      return;
    }
  }
}

}
