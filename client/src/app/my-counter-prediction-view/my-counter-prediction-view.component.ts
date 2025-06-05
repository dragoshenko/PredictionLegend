import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { FormsModule } from '@angular/forms';

interface CounterPredictionDetail {
  id: number;
  originalPredictionId: number;
  originalTitle: string;
  originalAuthor: any;
  predictionType: string | number;
  createdAt: Date;
  totalScore: number;
  isCounterPrediction: boolean;
  counterPredictionType: string;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
}

@Component({
  selector: 'app-my-counter-prediction-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-counter-prediction-view.component.html',
  styleUrls: ['./my-counter-prediction-view.component.css']
})
export class MyCounterPredictionViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  counterPredictionDetail: CounterPredictionDetail | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const counterPredictionId = +params['id'];
      const type = params['type'];
      if (counterPredictionId && type) {
        this.loadCounterPredictionDetails(counterPredictionId, type);
      }
    });
  }

  async loadCounterPredictionDetails(counterPredictionId: number, type: string): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Loading counter prediction details:', counterPredictionId, type);

      const response = await this.http.get<CounterPredictionDetail>(
        `${environment.apiUrl}post/my-counter-prediction/${counterPredictionId}/${type}`
      ).toPromise();

      if (response) {
        this.counterPredictionDetail = response;
        console.log('Counter prediction details loaded:', this.counterPredictionDetail);
      }
    } catch (error) {
      console.error('Error loading counter prediction details:', error);
      this.toastr.error('Failed to load your counter prediction details');
      this.router.navigate(['/my-predictions']);
    } finally {
      this.isLoading = false;
    }
  }

  // TYPE CHECKING METHODS
  isRankingType(): boolean {
    const type = this.counterPredictionDetail?.predictionType;
    return type === 'Ranking' || type === 0 || type === '0';
  }

  isBingoType(): boolean {
    const type = this.counterPredictionDetail?.predictionType;
    return type === 'Bingo' || type === 2 || type === '2';
  }

  isBracketType(): boolean {
    const type = this.counterPredictionDetail?.predictionType;
    return type === 'Bracket' || type === 1 || type === '1';
  }

  getPredictionTypeDisplayName(): string {
    if (this.isRankingType()) return 'Ranking';
    if (this.isBracketType()) return 'Bracket';
    if (this.isBingoType()) return 'Bingo';
    return `Unknown (${this.counterPredictionDetail?.predictionType})`;
  }

  // DATA ACCESS METHODS
  hasPostData(): boolean {
    return this.hasRankingData() || this.hasBingoData() || this.hasBracketData();
  }

  hasRankingData(): boolean {
    return this.isRankingType() && !!this.counterPredictionDetail?.postRank;
  }

  hasBingoData(): boolean {
    return this.isBingoType() && !!this.counterPredictionDetail?.postBingo;
  }

  hasBracketData(): boolean {
    return this.isBracketType() && !!this.counterPredictionDetail?.postBracket;
  }

  // RANKING DATA METHODS
  getRankingData(): any {
    return this.counterPredictionDetail?.postRank;
  }

  getRankingRows(): any[] {
    return this.getRankingData()?.rankTable?.rows || [];
  }

  getFirstRowColumns(): any[] {
    const rows = this.getRankingRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getAssignedTeamsCount(): number {
    const rows = this.getRankingRows();
    let count = 0;
    rows.forEach(row => {
      if (row.columns && Array.isArray(row.columns)) {
        row.columns.forEach((col: any) => {
          if (col.team) count++;
        });
      }
    });
    return count;
  }

  getTotalSlotsCount(): number {
    const rankingData = this.getRankingData();
    if (!rankingData?.rankTable) return 0;
    const rows = rankingData.rankTable.numberOfRows || 0;
    const cols = rankingData.rankTable.numberOfColumns || 0;
    return rows * cols;
  }

  getCompletionPercentage(): number {
    if (this.isRankingType()) {
      const assigned = this.getAssignedTeamsCount();
      const total = this.getTotalSlotsCount();
      return total > 0 ? Math.round((assigned / total) * 100) : 0;
    } else if (this.isBingoType()) {
      return this.getBingoCompletionPercentage();
    }
    return 0;
  }

  // BINGO DATA METHODS
  getBingoData(): any {
    return this.counterPredictionDetail?.postBingo;
  }

  getBingoCells(): any[] {
    return this.getBingoData()?.bingoCells || [];
  }

  getFilledBingoCellsCount(): number {
    const cells = this.getBingoCells();
    if (!Array.isArray(cells)) return 0;
    return cells.filter(cell => cell && cell.team).length;
  }

  getBingoCompletionPercentage(): number {
    const cells = this.getBingoCells();
    if (!Array.isArray(cells) || cells.length === 0) return 0;
    const filled = this.getFilledBingoCellsCount();
    return Math.round((filled / cells.length) * 100);
  }

  getUniqueBingoTeamsCount(): number {
    const cells = this.getBingoCells();
    if (!Array.isArray(cells)) return 0;

    const teamIds = new Set();
    cells.forEach(cell => {
      if (cell && cell.team && cell.team.id) {
        teamIds.add(cell.team.id);
      }
    });
    return teamIds.size;
  }

  // UTILITY METHODS
  formatDate(dateString: string | Date): string {
    if (!dateString || dateString === '0001-01-01T00:00:00' ||
        (typeof dateString === 'string' && dateString.startsWith('0001-01-01'))) {
      return 'Not available';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  // ACTION METHODS
  viewOriginalPrediction(): void {
    if (this.counterPredictionDetail?.originalPredictionId) {
      this.router.navigate(['/prediction-details', this.counterPredictionDetail.originalPredictionId]);
    }
  }

  compareWithOriginal(): void {
    if (this.counterPredictionDetail?.originalPredictionId) {
      this.router.navigate(['/prediction-details', this.counterPredictionDetail.originalPredictionId], {
        queryParams: { compare: 'true', myCounterId: this.counterPredictionDetail.id }
      });
    }
  }

  shareCounterPrediction(): void {
    if (!this.counterPredictionDetail?.originalPredictionId) return;

    const url = `${window.location.origin}/prediction-details/${this.counterPredictionDetail.originalPredictionId}`;

    if (navigator.share) {
      navigator.share({
        title: `Check out my counter prediction for "${this.counterPredictionDetail.originalTitle}"`,
        text: `I created a counter prediction for this ${this.getPredictionTypeDisplayName().toLowerCase()}`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Link copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy link');
      });
    }
  }

  async deleteCounterPrediction(): Promise<void> {
    if (!this.counterPredictionDetail) return;

    if (!confirm('Are you sure you want to delete this counter prediction? This action cannot be undone.')) {
      return;
    }

    try {
      const type = this.counterPredictionDetail.counterPredictionType.toLowerCase();
      await this.http.delete(`${environment.apiUrl}post/counter-prediction/${this.counterPredictionDetail.id}/${type}`).toPromise();
      this.toastr.success('Counter prediction deleted successfully');
      this.router.navigate(['/my-predictions']);
    } catch (error) {
      console.error('Error deleting counter prediction:', error);
      this.toastr.error('Failed to delete counter prediction');
    }
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
