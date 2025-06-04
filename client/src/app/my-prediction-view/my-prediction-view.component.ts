import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { FormsModule } from '@angular/forms';

interface MyPredictionDetail {
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
  counterPredictionsCount?: number;
  privacyType?: string;
  accessCode?: string;
}

@Component({
  selector: 'app-my-prediction-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-prediction-view.component.html',
  styleUrls: ['./my-prediction-view.component.css'],
})

export class MyPredictionViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  predictionDetail: MyPredictionDetail | null = null;
  isLoading = false;
  showDebugInfo = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const predictionId = +params['id'];
      if (predictionId) {
        this.loadMyPredictionDetails(predictionId);
      }
    });
  }

  async loadMyPredictionDetails(predictionId: number): Promise<void> {
    this.isLoading = true;
    try {
      console.log('Loading my prediction details for ID:', predictionId);

      const response = await this.http.get<MyPredictionDetail>(
        `${environment.apiUrl}post/my-prediction/${predictionId}`
      ).toPromise();

      if (response) {
        this.predictionDetail = response;
        console.log('My prediction details loaded:', this.predictionDetail);
      }
    } catch (error) {
      console.error('Error loading my prediction details:', error);
      this.toastr.error('Failed to load your prediction details');
      this.router.navigate(['/my-predictions']);
    } finally {
      this.isLoading = false;
    }
  }

  // TYPE CHECKING METHODS
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

  // STATUS METHODS
  getStatusText(): string {
    if (this.predictionDetail?.isDraft) return 'Draft';
    if (this.predictionDetail?.isActive) return 'Active';
    return 'Ended';
  }

  getStatusClass(): string {
    if (this.predictionDetail?.isDraft) return 'text-warning';
    if (this.predictionDetail?.isActive) return 'text-success';
    return 'text-secondary';
  }


  // RANKING DATA METHODS
  hasOriginalRankingData(): boolean {
    if (!this.isRankingType() || !this.predictionDetail?.postRanks) {
      return false;
    }

    const hasPostRanks = this.predictionDetail.postRanks.length > 0;
    const originalData = this.getOriginalRankingData();
    const hasRankTable = originalData?.rankTable?.rows && originalData.rankTable.rows.length > 0;

    return hasPostRanks && Boolean(hasRankTable);
  }

  getOriginalRankingData(): any {
    if (!this.predictionDetail?.postRanks || this.predictionDetail.postRanks.length === 0) {
      return null;
    }

    const userRanking = this.predictionDetail.postRanks.find(pr => pr.userId === this.predictionDetail?.userId);
    return userRanking || this.predictionDetail.postRanks[0];
  }

  getOriginalRankingRows(): any[] {
    const originalData = this.getOriginalRankingData();
    return originalData?.rankTable?.rows || [];
  }

  getFirstRowColumns(): any[] {
    const rows = this.getOriginalRankingRows();
    return rows.length > 0 ? (rows[0].columns || []) : [];
  }

  getAssignedTeamsCount(): number {
    const rows = this.getOriginalRankingRows();
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
    const originalData = this.getOriginalRankingData();
    if (!originalData?.rankTable) return 0;
    const rows = originalData.rankTable.numberOfRows || 0;
    const cols = originalData.rankTable.numberOfColumns || 0;
    return rows * cols;
  }

  // BINGO DATA METHODS
  hasOriginalBingoData(): boolean {
    if (!this.isBingoType() || !this.predictionDetail?.postBingos) {
      return false;
    }

    const hasPostBingos = this.predictionDetail.postBingos.length > 0;
    const originalData = this.getOriginalBingoData();
    const hasBingoCells = originalData?.bingoCells && originalData.bingoCells.length > 0;

    return hasPostBingos && Boolean(hasBingoCells);
  }

  getOriginalBingoData(): any {
    if (!this.predictionDetail?.postBingos || this.predictionDetail.postBingos.length === 0) {
      return null;
    }

    const userBingo = this.predictionDetail.postBingos.find(pb => pb.userId === this.predictionDetail?.userId);
    return userBingo || this.predictionDetail.postBingos[0];
  }

  getOriginalBingoCells(): any[] {
    const originalData = this.getOriginalBingoData();
    return originalData?.bingoCells || [];
  }

  getFilledBingoCellsCount(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells)) return 0;
    return cells.filter(cell => cell && cell.team).length;
  }

  getBingoCompletionPercentage(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells) || cells.length === 0) return 0;
    const filled = this.getFilledBingoCellsCount();
    return Math.round((filled / cells.length) * 100);
  }

  getUniqueBingoTeamsCount(): number {
    const cells = this.getOriginalBingoCells();
    if (!Array.isArray(cells)) return 0;

    const teamIds = new Set();
    cells.forEach(cell => {
      if (cell && cell.team && cell.team.id) {
        teamIds.add(cell.team.id);
      }
    });
    return teamIds.size;
  }

  // GENERAL DATA METHODS
  hasOriginalPostData(): boolean {
    return this.hasOriginalRankingData() || this.hasOriginalBingoData();
  }

  getAvailableTeams(): any[] {
    const teams: any[] = [];
    const seenTeamIds = new Set<number>();

    if (this.isRankingType() && this.hasOriginalRankingData()) {
      const originalData = this.getOriginalRankingData();
      originalData?.rankTable?.rows?.forEach((row: any) => {
        row.columns?.forEach((column: any) => {
          if (column.team && !seenTeamIds.has(column.team.id)) {
            seenTeamIds.add(column.team.id);
            teams.push(column.team);
          }
        });
      });
    } else if (this.isBingoType() && this.hasOriginalBingoData()) {
      const originalData = this.getOriginalBingoData();
      originalData?.bingoCells?.forEach((cell: any) => {
        if (cell.team && !seenTeamIds.has(cell.team.id)) {
          seenTeamIds.add(cell.team.id);
          teams.push(cell.team);
        }
      });
    }

    return teams;
  }

  // FIXED CATEGORY ICON METHODS
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
      'basketball': 'fa-basketball',
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
      'fa-trophy', 'fa-soccer-ball-o', 'fa-football', 'fa-basketball', 'fa-baseball',
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

  // This is the key method that fixes the icon display issue
  getFullIconClass(iconName: string | undefined): string {
    const safeIcon = this.getSafeIconClass(iconName);
    return `fa ${safeIcon}`;
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
  editPrediction(): void {
    if (this.predictionDetail) {
      this.router.navigate(['/create-prediction'], {
        queryParams: { edit: this.predictionDetail.id }
      });
    }
  }

  async publishPrediction(): Promise<void> {
    if (!this.predictionDetail) return;

    if (!confirm('Are you sure you want to publish this prediction? Once published, other users will be able to see and counter-predict it.')) {
      return;
    }

    try {
      await this.http.put(`${environment.apiUrl}prediction/${this.predictionDetail.id}/publish`, {}).toPromise();
      this.toastr.success('Prediction published successfully!');
      this.loadMyPredictionDetails(this.predictionDetail.id);
    } catch (error) {
      console.error('Error publishing prediction:', error);
      this.toastr.error('Failed to publish prediction');
    }
  }

  viewCounterPredictions(): void {
    if (this.predictionDetail) {
      this.router.navigate(['/prediction-details', this.predictionDetail.id], {
        fragment: 'counter-predictions'
      });
    }
  }

  async deletePrediction(): Promise<void> {
    if (!this.predictionDetail) return;

    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}prediction/${this.predictionDetail.id}`).toPromise();
      this.toastr.success('Prediction deleted successfully');
      this.router.navigate(['/my-predictions']);
    } catch (error) {
      console.error('Error deleting prediction:', error);
      this.toastr.error('Failed to delete prediction');
    }
  }

  getPrivacyTypeDisplayName(privacyType: any): string {
    // Handle string values (already correct)
    if (typeof privacyType === 'string') {
      return privacyType;
    }

    // Convert numeric enum values to string names
    switch (privacyType) {
      case 0:
      case '0':
        return 'Public';
      case 1:
      case '1':
        return 'Private';
      case 2:
      case '2':
        return 'Link Only';
      default:
        return 'Public';
    }
  }
  sharePost(): void {
    if (!this.predictionDetail) return;

    const url = `${window.location.origin}/prediction-details/${this.predictionDetail.id}`;

    if (navigator.share) {
      navigator.share({
        title: this.predictionDetail.title,
        text: this.predictionDetail.description,
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

  copyAccessCode(): void {
    if (this.predictionDetail?.accessCode) {
      navigator.clipboard.writeText(this.predictionDetail.accessCode).then(() => {
        this.toastr.success('Access code copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy access code');
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }

}
