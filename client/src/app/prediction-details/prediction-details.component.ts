import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  isOfficialResult?: boolean;
}

interface ComparisonResult {
  totalMatches: number;
  totalPositions: number;
  accuracy: number;
  matches: PositionMatch[];
  mismatches: PositionMismatch[];
  hasComparison: boolean;
}

interface PositionMatch {
  position: string;
  rowIndex: number;
  colIndex: number;
  teamName: string;
  matchType: 'exact' | 'partial';
}

interface PositionMismatch {
  position: string;
  rowIndex: number;
  colIndex: number;
  counterTeam: any;
  officialTeam: any;
  mismatchType: 'different-team' | 'extra-team' | 'missing-team';
}

@Component({
  selector: 'app-prediction-details',
  imports: [CommonModule, CounterPredictionComponent, FormsModule],
  templateUrl: './prediction-details.component.html',
  styleUrls: ['./prediction-details.component.css']
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

  // Counter Predictions Pagination
  counterPredictionsCurrentPage = 1;
  counterPredictionsPerPage = 10;

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

        // Log different types of predictions
        const originalData = this.getOriginalPostData();
        const officialResults = this.getOfficialResults();
        const counterPredictions = this.getAllCounterPredictions();

        console.log('Original post data:', originalData);
        console.log('Official Results:', officialResults.length);
        console.log('Counter Predictions:', counterPredictions.length);
      }
    } catch (error) {
      console.error('Error loading prediction details:', error);
      this.toastr.error('Failed to load prediction details');
    } finally {
      this.isLoading = false;
    }
  }

  canShowCounterPrediction(): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser || !this.predictionDetail) {
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

    if (!hasPostData || !hasTeams) {
      return false;
    }

    // UPDATED: Block original author from creating counter predictions
    if (this.predictionDetail.userId === currentUser.id) {
      return false;
    }

    // NEW: Block counter predictions if official results have been published
    if (this.hasOfficialResults()) {
      return false;
    }

    // Check if user already has a counter prediction
    const hasExistingCounter = this.userHasCounterPrediction(currentUser.id);

    return !hasExistingCounter;
  }

  // NEW: Check if official results exist
  hasOfficialResults(): boolean {
    const officialResults = this.getOfficialResults();
    return officialResults.length > 0;
  }

  userHasCounterPrediction(userId: number): boolean {
    const allCounters = this.getAllCounterPredictions();
    return allCounters.some(counter => counter.userId === userId);
  }

  // FIXED: Get counter predictions (exclude ALL author posts - both original and official results)
  getAllCounterPredictions(): CounterPredictionData[] {
    const counters: CounterPredictionData[] = [];

    // Get counter rankings (exclude ALL author posts)
    if (this.predictionDetail?.postRanks) {
      this.predictionDetail.postRanks.forEach((postRank, index) => {
        const isAuthorPost = postRank.userId === this.predictionDetail?.userId;

        // Only include non-author posts as counter predictions
        if (!isAuthorPost) {
          counters.push({
            id: postRank.id,
            author: postRank.user,
            createdAt: new Date(postRank.createdAt),
            totalScore: postRank.totalScore,
            postRank: postRank,
            userId: postRank.userId,
            isOfficialResult: false
          });
        }
      });
    }

    // Get counter bingos (exclude ALL author posts)
    if (this.predictionDetail?.postBingos) {
      this.predictionDetail.postBingos.forEach((postBingo, index) => {
        const isAuthorPost = postBingo.userId === this.predictionDetail?.userId;

        // Only include non-author posts as counter predictions
        if (!isAuthorPost) {
          counters.push({
            id: postBingo.id,
            author: postBingo.user,
            createdAt: new Date(postBingo.createdAt),
            totalScore: postBingo.totalScore,
            postBingo: postBingo,
            userId: postBingo.userId,
            isOfficialResult: false
          });
        }
      });
    }

    // Sort by creation date (newest first)
    return counters.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // FIXED: Get official results (author's posts EXCLUDING the first/original one)
  getOfficialResults(): CounterPredictionData[] {
    const officialResults: CounterPredictionData[] = [];

    // Get official ranking results (author's posts excluding the first one)
    if (this.predictionDetail?.postRanks) {
      const authorPosts = this.predictionDetail.postRanks
        .filter(postRank => postRank.userId === this.predictionDetail?.userId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Skip the first post (index 0) and include the rest as official results
      authorPosts.slice(1).forEach((postRank) => {
        officialResults.push({
          id: postRank.id,
          author: postRank.user,
          createdAt: new Date(postRank.createdAt),
          totalScore: postRank.totalScore,
          postRank: postRank,
          userId: postRank.userId,
          isOfficialResult: true
        });
      });
    }

    // Get official bingo results (author's posts excluding the first one)
    if (this.predictionDetail?.postBingos) {
      const authorPosts = this.predictionDetail.postBingos
        .filter(postBingo => postBingo.userId === this.predictionDetail?.userId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Skip the first post (index 0) and include the rest as official results
      authorPosts.slice(1).forEach((postBingo) => {
        officialResults.push({
          id: postBingo.id,
          author: postBingo.user,
          createdAt: new Date(postBingo.createdAt),
          totalScore: postBingo.totalScore,
          postBingo: postBingo,
          userId: postBingo.userId,
          isOfficialResult: true
        });
      });
    }

    // Sort by creation date (oldest first for official results)
    return officialResults.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // NEW: Separate getter methods for template
  getOfficialRankingResults(): CounterPredictionData[] {
    return this.getOfficialResults().filter(r => r.postRank);
  }

  getOfficialBingoResults(): CounterPredictionData[] {
    return this.getOfficialResults().filter(r => r.postBingo);
  }

  // FIXED: Get the FIRST (original) post by the author for display
  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks || this.predictionDetail.postRanks.length === 0) {
      return null;
    }

    // Find the FIRST (oldest) post by the prediction author
    const authorPosts = this.predictionDetail.postRanks
      .filter(pr => pr.userId === this.predictionDetail?.userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (authorPosts.length > 0) {
      return authorPosts[0]; // Return the FIRST (original) post
    }

    // Fallback to the first post if no author post found
    return this.predictionDetail.postRanks[0];
  }

  // FIXED: Get the FIRST (original) bingo post by the author for display
  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos || this.predictionDetail.postBingos.length === 0) {
      return null;
    }

    // Find the FIRST (oldest) post by the prediction author
    const authorPosts = this.predictionDetail.postBingos
      .filter(pb => pb.userId === this.predictionDetail?.userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (authorPosts.length > 0) {
      return authorPosts[0]; // Return the FIRST (original) post
    }

    // Fallback to the first post if no author post found
    return this.predictionDetail.postBingos[0];
  }

  getCounterPredictionUnavailableReason(): string {
    const currentUser = this.accountService.currentUser();

    if (!currentUser) {
      return 'You must be logged in to create counter predictions.';
    }

    if (!this.predictionDetail) {
      return 'Prediction data is still loading...';
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

    if (this.predictionDetail.userId === currentUser.id) {
      return 'You cannot create counter predictions for your own prediction. You can add official results instead.';
    }

    // NEW: Check for official results
    if (this.hasOfficialResults()) {
      return 'Counter predictions are no longer allowed. The author has published official results for this prediction.';
    }

    if (this.userHasCounterPrediction(currentUser.id)) {
      return 'You have already created a counter prediction for this post.';
    }

    return 'Counter prediction is not available for this post.';
  }

  // Counter Predictions Pagination Methods (updated to work with new structure)
  getCounterPredictionTotalPages(): number {
    if (this.counterPredictionsPerPage >= 50) return 1; // Show all
    return Math.ceil(this.getAllCounterPredictions().length / this.counterPredictionsPerPage);
  }

  getCounterPredictionDisplayRange(): string {
    const total = this.getAllCounterPredictions().length;
    if (total === 0) return '0';
    if (this.counterPredictionsPerPage >= 50) return `1-${total}`;

    const start = (this.counterPredictionsCurrentPage - 1) * this.counterPredictionsPerPage + 1;
    const end = Math.min(this.counterPredictionsCurrentPage * this.counterPredictionsPerPage, total);
    return `${start}-${end}`;
  }

  getCounterPredictionVisiblePages(): number[] {
    const totalPages = this.getCounterPredictionTotalPages();
    const currentPage = this.counterPredictionsCurrentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 4) {
        pages.push(-1); // Ellipsis
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) {
        pages.push(-1); // Ellipsis
      }
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages.filter(page => page !== -1);
  }

  goToCounterPredictionPage(page: number): void {
    if (page < 1 || page > this.getCounterPredictionTotalPages()) return;
    this.counterPredictionsCurrentPage = page;

    // Scroll to top of counter predictions section
    setTimeout(() => {
      const element = document.getElementById('counter-predictions');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onCounterPredictionsPageSizeChange(): void {
    this.counterPredictionsCurrentPage = 1;
  }

  getCounterPredictionGlobalIndex(localIndex: number): number {
    return (this.counterPredictionsCurrentPage - 1) * this.counterPredictionsPerPage + localIndex + 1;
  }

  getPaginatedCounterRankings(): CounterPredictionData[] {
    const allCounters = this.getCounterRankings();
    if (this.counterPredictionsPerPage >= 50) return allCounters;

    const startIndex = (this.counterPredictionsCurrentPage - 1) * this.counterPredictionsPerPage;
    const endIndex = startIndex + this.counterPredictionsPerPage;
    return allCounters.slice(startIndex, endIndex);
  }

  getPaginatedCounterBingos(): CounterPredictionData[] {
    const allCounters = this.getCounterBingos();
    if (this.counterPredictionsPerPage >= 50) return allCounters;

    const startIndex = (this.counterPredictionsCurrentPage - 1) * this.counterPredictionsPerPage;
    const endIndex = startIndex + this.counterPredictionsPerPage;
    return allCounters.slice(startIndex, endIndex);
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

  compareWithOfficialResults(counterPrediction: CounterPredictionData): ComparisonResult {
    const officialResults = this.getOfficialResults();

    if (officialResults.length === 0) {
      return {
        totalMatches: 0,
        totalPositions: 0,
        accuracy: 0,
        matches: [],
        mismatches: [],
        hasComparison: false
      };
    }

    // Use the first (primary) official result for comparison
    const primaryOfficial = officialResults[0];

    if (this.isRankingType() && counterPrediction.postRank && primaryOfficial.postRank) {
      return this.compareRankings(counterPrediction.postRank, primaryOfficial.postRank);
    } else if (this.isBingoType() && counterPrediction.postBingo && primaryOfficial.postBingo) {
      return this.compareBingos(counterPrediction.postBingo, primaryOfficial.postBingo);
    }

    return {
      totalMatches: 0,
      totalPositions: 0,
      accuracy: 0,
      matches: [],
      mismatches: [],
      hasComparison: false
    };
  }

  /**
   * Compare two ranking predictions
   */
  private compareRankings(counterRank: any, officialRank: any): ComparisonResult {
    const matches: PositionMatch[] = [];
    const mismatches: PositionMismatch[] = [];

    const counterRows = counterRank.rankTable?.rows || [];
    const officialRows = officialRank.rankTable?.rows || [];

    let totalPositions = 0;
    let totalMatches = 0;

    // Compare each position
    for (let rowIndex = 0; rowIndex < Math.max(counterRows.length, officialRows.length); rowIndex++) {
      const counterRow = counterRows[rowIndex];
      const officialRow = officialRows[rowIndex];

      if (!counterRow || !officialRow) continue;

      const counterColumns = counterRow.columns || [];
      const officialColumns = officialRow.columns || [];

      for (let colIndex = 0; colIndex < Math.max(counterColumns.length, officialColumns.length); colIndex++) {
        const counterColumn = counterColumns[colIndex];
        const officialColumn = officialColumns[colIndex];

        if (!counterColumn || !officialColumn) continue;

        totalPositions++;

        const counterTeamId = counterColumn.team?.id;
        const officialTeamId = officialColumn.team?.id;

        if (counterTeamId && officialTeamId && counterTeamId === officialTeamId) {
          // Perfect match - same team in same position
          totalMatches++;
          matches.push({
            position: `Rank ${rowIndex + 1}`,
            rowIndex,
            colIndex,
            teamName: counterColumn.team.name,
            matchType: 'exact'
          });
        } else if (counterTeamId && officialTeamId) {
          // Different teams in this position
          mismatches.push({
            position: `Rank ${rowIndex + 1}`,
            rowIndex,
            colIndex,
            counterTeam: counterColumn.team,
            officialTeam: officialColumn.team,
            mismatchType: 'different-team'
          });
        } else if (counterTeamId && !officialTeamId) {
          // Counter has team, official is empty
          mismatches.push({
            position: `Rank ${rowIndex + 1}`,
            rowIndex,
            colIndex,
            counterTeam: counterColumn.team,
            officialTeam: null,
            mismatchType: 'extra-team'
          });
        } else if (!counterTeamId && officialTeamId) {
          // Official has team, counter is empty
          mismatches.push({
            position: `Rank ${rowIndex + 1}`,
            rowIndex,
            colIndex,
            counterTeam: null,
            officialTeam: officialColumn.team,
            mismatchType: 'missing-team'
          });
        }
      }
    }

    return {
      totalMatches,
      totalPositions,
      accuracy: totalPositions > 0 ? Math.round((totalMatches / totalPositions) * 100) : 0,
      matches,
      mismatches,
      hasComparison: true
    };
  }

  /**
   * Compare two bingo predictions
   */
  private compareBingos(counterBingo: any, officialBingo: any): ComparisonResult {
    const matches: PositionMatch[] = [];
    const mismatches: PositionMismatch[] = [];

    const counterCells = counterBingo.bingoCells || [];
    const officialCells = officialBingo.bingoCells || [];

    let totalPositions = 0;
    let totalMatches = 0;

    // Compare each cell
    const maxCells = Math.max(counterCells.length, officialCells.length);

    for (let cellIndex = 0; cellIndex < maxCells; cellIndex++) {
      const counterCell = counterCells[cellIndex];
      const officialCell = officialCells[cellIndex];

      if (!counterCell || !officialCell) continue;

      totalPositions++;

      const counterTeamId = counterCell.team?.id;
      const officialTeamId = officialCell.team?.id;

      if (counterTeamId && officialTeamId && counterTeamId === officialTeamId) {
        // Perfect match
        totalMatches++;
        matches.push({
          position: `Cell (${counterCell.row + 1}, ${counterCell.column + 1})`,
          rowIndex: counterCell.row,
          colIndex: counterCell.column,
          teamName: counterCell.team.name,
          matchType: 'exact'
        });
      } else if (counterTeamId && officialTeamId) {
        // Different teams
        mismatches.push({
          position: `Cell (${counterCell.row + 1}, ${counterCell.column + 1})`,
          rowIndex: counterCell.row,
          colIndex: counterCell.column,
          counterTeam: counterCell.team,
          officialTeam: officialCell.team,
          mismatchType: 'different-team'
        });
      } else if (counterTeamId && !officialTeamId) {
        // Counter has team, official is empty
        mismatches.push({
          position: `Cell (${counterCell.row + 1}, ${counterCell.column + 1})`,
          rowIndex: counterCell.row,
          colIndex: counterCell.column,
          counterTeam: counterCell.team,
          officialTeam: null,
          mismatchType: 'extra-team'
        });
      } else if (!counterTeamId && officialTeamId) {
        // Official has team, counter is empty
        mismatches.push({
          position: `Cell (${counterCell.row + 1}, ${counterCell.column + 1})`,
          rowIndex: counterCell.row,
          colIndex: counterCell.column,
          counterTeam: null,
          officialTeam: officialCell.team,
          mismatchType: 'missing-team'
        });
      }
    }

    return {
      totalMatches,
      totalPositions,
      accuracy: totalPositions > 0 ? Math.round((totalMatches / totalPositions) * 100) : 0,
      matches,
      mismatches,
      hasComparison: true
    };
  }

  /**
   * Check if a specific position matches the official result
   */
  isPositionMatch(counterPrediction: CounterPredictionData, rowIndex: number, colIndex: number): boolean {
    const comparison = this.compareWithOfficialResults(counterPrediction);

    if (this.isRankingType()) {
      return comparison.matches.some(match =>
        match.rowIndex === rowIndex && match.colIndex === colIndex
      );
    } else if (this.isBingoType()) {
      // For bingo, we need to convert cell index back to row/col
      const gridSize = counterPrediction.postBingo?.gridSize || 5;
      const cellIndex = rowIndex * gridSize + colIndex;
      const counterCells = counterPrediction.postBingo?.bingoCells || [];
      const cell = counterCells[cellIndex];

      if (cell) {
        return comparison.matches.some(match =>
          match.rowIndex === cell.row && match.colIndex === cell.column
        );
      }
    }

    return false;
  }

  /**
   * Check if a specific position is a mismatch
   */
  isPositionMismatch(counterPrediction: CounterPredictionData, rowIndex: number, colIndex: number): boolean {
    const comparison = this.compareWithOfficialResults(counterPrediction);

    if (this.isRankingType()) {
      return comparison.mismatches.some(mismatch =>
        mismatch.rowIndex === rowIndex && mismatch.colIndex === colIndex
      );
    } else if (this.isBingoType()) {
      // For bingo, we need to convert cell index back to row/col
      const gridSize = counterPrediction.postBingo?.gridSize || 5;
      const cellIndex = rowIndex * gridSize + colIndex;
      const counterCells = counterPrediction.postBingo?.bingoCells || [];
      const cell = counterCells[cellIndex];

      if (cell) {
        return comparison.mismatches.some(mismatch =>
          mismatch.rowIndex === cell.row && mismatch.colIndex === cell.column
        );
      }
    }

    return false;
  }

  /**
   * Get CSS classes for position styling based on comparison
   */
  getPositionComparisonClass(counterPrediction: CounterPredictionData, rowIndex: number, colIndex: number): string {
    const officialResults = this.getOfficialResults();

    if (officialResults.length === 0) {
      return ''; // No comparison available
    }

    if (this.isPositionMatch(counterPrediction, rowIndex, colIndex)) {
      return 'comparison-match';
    } else if (this.isPositionMismatch(counterPrediction, rowIndex, colIndex)) {
      return 'comparison-mismatch';
    }

    return 'comparison-neutral';
  }

  /**
   * Get comparison tooltip text
   */
  getComparisonTooltip(counterPrediction: CounterPredictionData, rowIndex: number, colIndex: number): string {
    const officialResults = this.getOfficialResults();

    if (officialResults.length === 0) {
      return 'No official results available for comparison';
    }

    if (this.isPositionMatch(counterPrediction, rowIndex, colIndex)) {
      return '✅ Correct! This matches the official result';
    } else if (this.isPositionMismatch(counterPrediction, rowIndex, colIndex)) {
      return '❌ Incorrect - different from official result';
    }

    return 'Neutral position';
  }

  /**
   * Get overall accuracy for a counter prediction
   */
  getAccuracy(counterPrediction: CounterPredictionData): number {
    const comparison = this.compareWithOfficialResults(counterPrediction);
    return comparison.accuracy;
  }

  /**
   * Get accuracy badge class
   */
  getAccuracyBadgeClass(accuracy: number): string {
    if (accuracy >= 80) return 'bg-success';
    if (accuracy >= 60) return 'bg-warning text-dark';
    if (accuracy >= 40) return 'bg-orange text-white';
    return 'bg-danger';
  }

  /**
   * Get accuracy description
   */
  getAccuracyDescription(accuracy: number): string {
    if (accuracy >= 90) return 'Excellent prediction!';
    if (accuracy >= 80) return 'Very good prediction';
    if (accuracy >= 60) return 'Good prediction';
    if (accuracy >= 40) return 'Fair prediction';
    if (accuracy >= 20) return 'Poor prediction';
    return 'Very different from official';
  }

  // HELPER METHODS FOR RANKING DATA
  hasOriginalRankingData(): boolean {
    const isRanking = this.isRankingType();
    const hasPostRanks = this.predictionDetail?.postRanks && this.predictionDetail.postRanks.length > 0;
    const originalData = this.getOriginalRankingData();
    const hasRankTable = originalData?.rankTable?.rows && originalData.rankTable.rows.length > 0;

    return isRanking && hasPostRanks && hasRankTable;
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

  // Category icon methods
  getContrastColor(hexColor: string): string {
    if (!hexColor) return '#ffffff';

    const color = hexColor.replace('#', '');

    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? '#000000' : '#ffffff';
  }

  getSafeIconClass(iconName: string | undefined): string {
    if (!iconName) return 'fa-tag';

    const cleanIconName = iconName.replace('fa-', '').toLowerCase().trim();

    if (!cleanIconName) return 'fa-tag';

    const safeIconMap: { [key: string]: string } = {
      'sports': 'fa-trophy',
      'sport': 'fa-trophy',
      'soccer': 'fa-soccer-ball-o',
      'football': 'fa-football',
      'basketball': 'fa-basketball-ball',
      'baseball': 'fa-baseball',
      'tennis': 'fa-trophy',
      'golf': 'fa-trophy',
      'hockey': 'fa-trophy',
      'racing': 'fa-car',
      'olympics': 'fa-trophy',
      'championship': 'fa-trophy',
      'league': 'fa-trophy',
      'premier': 'fa-trophy',
      'competition': 'fa-trophy',
      'music': 'fa-music',
      'movies': 'fa-film',
      'tv': 'fa-tv',
      'entertainment': 'fa-film',
      'gaming': 'fa-gamepad',
      'esports': 'fa-gamepad',
      'technology': 'fa-laptop',
      'tech': 'fa-laptop',
      'software': 'fa-code',
      'mobile': 'fa-mobile',
      'computer': 'fa-laptop',
      'business': 'fa-briefcase',
      'finance': 'fa-money',
      'economy': 'fa-chart-line',
      'stocks': 'fa-chart-line',
      'education': 'fa-graduation-cap',
      'school': 'fa-graduation-cap',
      'university': 'fa-university',
      'science': 'fa-flask',
      'books': 'fa-book',
      'travel': 'fa-plane',
      'tourism': 'fa-plane',
      'geography': 'fa-globe',
      'world': 'fa-globe',
      'health': 'fa-heart',
      'medicine': 'fa-medkit',
      'fitness': 'fa-heart',
      'news': 'fa-newspaper-o',
      'politics': 'fa-institution',
      'government': 'fa-institution',
      'food': 'fa-cutlery',
      'cooking': 'fa-cutlery',
      'lifestyle': 'fa-home',
      'home': 'fa-home',
      'default': 'fa-tag',
      'category': 'fa-tag'
    };

    if (safeIconMap[cleanIconName]) {
      return safeIconMap[cleanIconName];
    }

    for (const [key, value] of Object.entries(safeIconMap)) {
      if (cleanIconName.includes(key) || key.includes(cleanIconName)) {
        return value;
      }
    }

    const knownSafeIcons = [
      'fa-trophy', 'fa-soccer-ball-o', 'fa-football', 'fa-basketball-ball', 'fa-baseball',
      'fa-music', 'fa-film', 'fa-tv', 'fa-gamepad', 'fa-laptop', 'fa-mobile',
      'fa-book', 'fa-graduation-cap', 'fa-university', 'fa-flask', 'fa-briefcase',
      'fa-money', 'fa-chart-line', 'fa-globe', 'fa-plane', 'fa-heart', 'fa-medkit',
      'fa-newspaper-o', 'fa-institution', 'fa-cutlery', 'fa-home', 'fa-users',
      'fa-tag', 'fa-tags', 'fa-star', 'fa-cog', 'fa-camera', 'fa-car'
    ];

    const withPrefix = iconName.startsWith('fa-') ? iconName : `fa-${iconName}`;
    if (knownSafeIcons.includes(withPrefix)) {
      return withPrefix;
    }

    const cleanWithPrefix = `fa-${cleanIconName}`;
    if (knownSafeIcons.includes(cleanWithPrefix)) {
      return cleanWithPrefix;
    }

    return 'fa-tag';
  }

  getFullIconClass(iconName: string | undefined): string {
    const safeIcon = this.getSafeIconClass(iconName);
    return `fa ${safeIcon}`;
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

  goBack(): void {
    this.router.navigate(['/published-posts']);
  }
}
