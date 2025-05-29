// published-posts.component.ts - UPDATED VERSION
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

interface PublishedPost {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  author: {
    id: number;
    displayName: string;
    photoUrl?: string;
  };
  categories: {
    id: number;
    name: string;
  }[];
  counterPredictionsCount: number;
  canCounterPredict: boolean;
  isActive: boolean;
  notes?: string;
  isDraft: boolean;
  privacyType: string;
}

@Component({
  selector: 'app-published-posts',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-globe me-2"></i>Published Predictions
              </h2>
              <p class="text-light mb-0 opacity-75">
                Discover and counter-predict active public predictions from the community
              </p>
            </div>
            <button class="btn btn-outline-light" routerLink="/create-prediction">
              <i class="fa fa-plus me-2"></i>Create New Prediction
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card bg-success border-success">
            <div class="card-body text-center">
              <i class="fa fa-globe fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ publishedPosts.length }}</h4>
              <p class="text-light mb-0">Active Posts</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-info border-info">
            <div class="card-body text-center">
              <i class="fa fa-users fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ totalCounterPredictions }}</h4>
              <p class="text-light mb-0">Total Responses</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-list-ol fa-2x text-dark mb-2"></i>
              <h4 class="text-dark">{{ getRankingCount() }}</h4>
              <p class="text-dark mb-0">Rankings</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-secondary border-secondary">
            <div class="card-body text-center">
              <i class="fa fa-th fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ getBingoCount() }}</h4>
              <p class="text-light mb-0">Bingo Games</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label text-light">Search</label>
              <input
                type="text"
                class="form-control bg-dark text-light border-secondary"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="Search predictions...">
            </div>
            <div class="col-md-3">
              <label class="form-label text-light">Prediction Type</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedType"
                (ngModelChange)="onFilterChange()">
                <option value="">All Types</option>
                <option value="Ranking">Ranking</option>
                <option value="Bracket">Bracket</option>
                <option value="Bingo">Bingo</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label text-light">Sort By</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="sortBy"
                (ngModelChange)="onFilterChange()">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostResponses">Most Responses</option>
                <option value="endingSoon">Ending Soon</option>
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button
                class="btn btn-outline-light w-100"
                (click)="clearFilters()">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Predictions List (Same style as My Predictions) -->
      <div class="row" *ngIf="filteredPosts.length > 0">
        <div class="col-lg-6 mb-4" *ngFor="let post of filteredPosts">
          <div class="card bg-dark border-dark h-100">
            <div class="card-header bg-dark border-dark">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="card-title text-light mb-1">{{ post.title }}</h6>
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa"
                       [ngClass]="{
                         'fa-list-ol': post.predictionType === 'Ranking',
                         'fa-sitemap': post.predictionType === 'Bracket',
                         'fa-th': post.predictionType === 'Bingo'
                       }" class="text-primary me-1"></i>
                    <span class="badge bg-primary">{{ post.predictionType }}</span>
                    <span class="badge bg-success">Active</span>
                    <span class="badge bg-info">Public</span>
                  </div>
                </div>
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-light dropdown-toggle"
                          type="button"
                          [id]="'dropdown-' + post.id"
                          data-bs-toggle="dropdown">
                    <i class="fa fa-ellipsis-v"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <button class="dropdown-item" (click)="viewPrediction(post.id)">
                        <i class="fa fa-eye me-2"></i>View Details
                      </button>
                    </li>
                    <li *ngIf="post.canCounterPredict">
                      <button class="dropdown-item" (click)="counterPredict(post.id)">
                        <i class="fa fa-plus me-2"></i>Counter Predict
                      </button>
                    </li>
                    <li *ngIf="post.counterPredictionsCount > 0">
                      <button class="dropdown-item" (click)="viewResponses(post.id)">
                        <i class="fa fa-users me-2"></i>View Responses
                      </button>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                    </li>
                    <li>
                      <button class="dropdown-item" (click)="sharePost(post.id)">
                        <i class="fa fa-share me-2"></i>Share
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="card-body">
              <!-- Author Info -->
              <div class="d-flex align-items-center mb-3">
                <img *ngIf="post.author.photoUrl" [src]="post.author.photoUrl"
                     class="rounded-circle me-2" width="32" height="32" alt="Author">
                <div class="me-auto">
                  <div class="fw-bold text-light small">{{ post.author.displayName }}</div>
                  <div class="text-muted very-small">{{ formatDate(post.createdAt) }}</div>
                </div>
                <div class="text-end">
                  <div class="badge bg-info small">
                    <i class="fa fa-users me-1"></i>{{ post.counterPredictionsCount }}
                  </div>
                </div>
              </div>

              <!-- Description -->
              <p class="card-text text-light small mb-3">
                {{ post.description | slice:0:120 }}{{ post.description.length > 120 ? '...' : '' }}
              </p>

              <!-- Categories -->
              <div class="mb-3" *ngIf="post.categories.length > 0">
                <div class="d-flex flex-wrap gap-1">
                  <span *ngFor="let category of post.categories.slice(0, 3)"
                        class="badge bg-secondary very-small">
                    {{ category.name }}
                  </span>
                  <span *ngIf="post.categories.length > 3"
                        class="badge bg-secondary very-small">
                    +{{ post.categories.length - 3 }} more
                  </span>
                </div>
              </div>

              <!-- End Date Info -->
              <div class="row">
                <div class="col-8">
                  <div *ngIf="post.endDate" class="small text-muted">
                    <i class="fa fa-clock-o me-1"></i>
                    Ends: {{ formatDate(post.endDate) }}
                  </div>
                  <div *ngIf="!post.endDate" class="small text-muted">
                    <i class="fa fa-infinity me-1"></i>
                    No end date
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="small text-muted">
                    {{ getDaysUntilEnd(post.endDate) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer bg-transparent border-dark">
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-primary btn-sm" (click)="viewPrediction(post.id)">
                  <i class="fa fa-eye me-1"></i>View Details
                </button>

                <div class="btn-group">
                  <button *ngIf="post.canCounterPredict"
                          class="btn btn-success btn-sm"
                          (click)="counterPredict(post.id)">
                    <i class="fa fa-plus me-1"></i>Counter Predict
                  </button>
                  <button *ngIf="!post.canCounterPredict && canViewOwnResponse(post)"
                          class="btn btn-info btn-sm"
                          (click)="viewOwnResponse(post.id)">
                    <i class="fa fa-eye me-1"></i>View My Response
                  </button>
                  <button *ngIf="post.counterPredictionsCount > 0"
                          class="btn btn-outline-info btn-sm"
                          (click)="viewResponses(post.id)">
                    <i class="fa fa-users me-1"></i>{{ post.counterPredictionsCount }} Responses
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading published predictions...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredPosts.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-globe fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">No Active Predictions Found</h5>
        <p class="text-muted">
          <span *ngIf="hasActiveFilters()">Try adjusting your search filters or</span>
          Be the first to create and publish a prediction for others to counter-predict!
        </p>
        <button class="btn btn-primary" routerLink="/create-prediction">
          <i class="fa fa-plus me-2"></i>Create the First Public Prediction
        </button>
      </div>

      <!-- Pagination -->
      <div class="d-flex justify-content-center mt-4" *ngIf="filteredPosts.length > 0 && totalPages > 1">
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="currentPage === 1">
              <button class="page-link bg-dark border-secondary text-light"
                      (click)="changePage(currentPage - 1)"
                      [disabled]="currentPage === 1">
                <i class="fa fa-chevron-left"></i> Previous
              </button>
            </li>
            <li class="page-item"
                *ngFor="let page of getPageNumbers()"
                [class.active]="page === currentPage">
              <button class="page-link bg-dark border-secondary text-light"
                      [class.bg-primary]="page === currentPage"
                      (click)="changePage(page)">
                {{ page }}
              </button>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages">
              <button class="page-link bg-dark border-secondary text-light"
                      (click)="changePage(currentPage + 1)"
                      [disabled]="currentPage === totalPages">
                Next <i class="fa fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Debug Info -->
      <div class="card bg-dark border-dark mt-4" *ngIf="showDebugInfo">
        <div class="card-header bg-dark border-dark">
          <h6 class="text-light mb-0">
            <i class="fa fa-bug me-2"></i>Debug Information
            <button class="btn btn-sm btn-outline-light float-end" (click)="showDebugInfo = false">Hide</button>
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-light">Raw API Response:</h6>
              <pre class="text-light small">{{ debugRawData | json }}</pre>
            </div>
            <div class="col-md-6">
              <h6 class="text-light">Filtered Posts:</h6>
              <pre class="text-light small">{{ filteredPosts | json }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Toggle Button -->
      <div class="fixed-bottom p-3" *ngIf="!showDebugInfo">
        <button class="btn btn-sm btn-outline-secondary" (click)="showDebugInfo = true">
          <i class="fa fa-bug me-1"></i>Debug
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border-radius: 8px;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .badge {
      font-size: 0.75rem;
    }

    .very-small {
      font-size: 0.7rem;
    }

    .pagination .page-link:hover {
      background-color: #495057;
      border-color: #6c757d;
    }

    .pagination .page-item.active .page-link {
      background-color: #0d6efd !important;
      border-color: #0d6efd;
    }

    .dropdown-menu {
      background-color: #343a40;
      border-color: #495057;
    }

    .dropdown-item {
      color: #fff;
    }

    .dropdown-item:hover {
      background-color: #495057;
      color: #fff;
    }

    pre {
      max-height: 300px;
      overflow-y: auto;
      font-size: 0.8rem;
    }

    .fixed-bottom {
      z-index: 1000;
    }

    .btn-group .btn {
      margin-left: 0.25rem;
    }
  `]
})
export class PublishedPostsComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  publishedPosts: PublishedPost[] = [];
  filteredPosts: PublishedPost[] = [];
  isLoading = false;
  showDebugInfo = false;
  debugRawData: any = null;

  // Filters
  searchTerm = '';
  selectedType = '';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  totalPosts = 0;

  private searchTimeout: any;

  // Computed properties
  get totalCounterPredictions(): number {
    return this.publishedPosts.reduce((sum, p) => sum + p.counterPredictionsCount, 0);
  }

  ngOnInit(): void {
    this.loadPublishedPosts();
  }

  // FIXED: Robust date parsing function that returns Date | undefined
  private parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;

    try {
      if (dateValue instanceof Date) {
        return new Date(dateValue.getTime());
      }

      if (typeof dateValue === 'string') {
        let dateString = dateValue.trim();

        // Convert European format to ISO
        if (dateString.match(/^\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2}:\d{2}$/)) {
          const parts = dateString.split(' ');
          const datePart = parts[0].split('.');
          const timePart = parts[1];
          dateString = `${datePart[2]}-${datePart[1]}-${datePart[0]}T${timePart}`;
        }

        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
          return parsed;
        }
      }

      if (typeof dateValue === 'number' && dateValue > 0) {
        const timestamp = dateValue > 1e10 ? dateValue : dateValue * 1000;
        const parsed = new Date(timestamp);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
          return parsed;
        }
      }

      return undefined;
    } catch (error) {
      console.error('Error parsing date:', dateValue, error);
      return undefined;
    }
  }

  // FIXED: Safe date formatting
  formatDate(date: Date | null | undefined): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date format error';
    }
  }

  async loadPublishedPosts(): Promise<void> {
    this.isLoading = true;
    try {
      const params = new URLSearchParams({
        pageNumber: this.currentPage.toString(),
        pageSize: this.pageSize.toString()
      });

      if (this.searchTerm) {
        params.append('searchTerm', this.searchTerm);
      }
      if (this.selectedType) {
        params.append('predictionType', this.selectedType);
      }

      const response = await this.http.get<PublishedPost[]>(
        `${environment.apiUrl}post/published?${params.toString()}`
      ).toPromise();

      console.log('Raw published posts response:', response);
      this.debugRawData = response;

      if (response) {
        // FIXED: Filter to only show active, non-draft, public posts
        const filteredResponse = response.filter(post =>
          post.isActive &&
          !post.isDraft &&
          (post.privacyType === 'Public' || post.privacyType === 'public' || !post.privacyType)
        );

        this.publishedPosts = filteredResponse.map(post => ({
          ...post,
          createdAt: this.parseDate(post.createdAt) || new Date(),
          endDate: this.parseDate(post.endDate),
          canCounterPredict: this.determineCanCounterPredict(post)
        }));

        console.log('Processed published posts:', this.publishedPosts);
        this.applyFiltersAndSorting();
      }
    } catch (error) {
      console.error('Error loading published posts:', error);
      this.toastr.error('Failed to load published predictions');

      // Mock data for development/testing
      this.publishedPosts = this.getMockPosts();
      this.applyFiltersAndSorting();
    } finally {
      this.isLoading = false;
    }
  }

  private determineCanCounterPredict(post: any): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return false;

    // Can't counter-predict your own posts
    if (post.author.id === currentUser.id) return false;

    // Can't counter-predict if already responded (this would need API support)
    // For now, assume they can if it's active and not theirs
    return post.isActive && !post.isDraft;
  }

  canViewOwnResponse(post: PublishedPost): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return false;

    // This would need API support to check if user has already responded
    // For now, return false
    return false;
  }

  applyFiltersAndSorting(): void {
    let filtered = [...this.publishedPosts];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        post.author.displayName.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(post => post.predictionType === this.selectedType);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'mostResponses':
        filtered.sort((a, b) => b.counterPredictionsCount - a.counterPredictionsCount);
        break;
      case 'endingSoon':
        filtered = filtered.filter(p => p.endDate).sort((a, b) => {
          if (!a.endDate || !b.endDate) return 0;
          return a.endDate.getTime() - b.endDate.getTime();
        });
        break;
      default: // newest
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    this.filteredPosts = filtered;
    this.totalPosts = filtered.length;
    this.totalPages = Math.ceil(this.totalPosts / this.pageSize);
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.applyFiltersAndSorting();
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.sortBy = 'newest';
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedType || this.sortBy !== 'newest');
  }

  getRankingCount(): number {
    return this.publishedPosts.filter(p => p.predictionType === 'Ranking').length;
  }

  getBingoCount(): number {
    return this.publishedPosts.filter(p => p.predictionType === 'Bingo').length;
  }

  getDaysUntilEnd(endDate: Date | undefined): string {
    if (!endDate || !(endDate instanceof Date)) {
      return '';
    }

    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Ended';
    } else if (diffDays === 0) {
      return 'Ends today';
    } else if (diffDays === 1) {
      return '1 day left';
    } else if (diffDays <= 7) {
      return `${diffDays} days left`;
    } else {
      return '';
    }
  }

  viewPrediction(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId]);
  }

  counterPredict(predictionId: number): void {
    // This would navigate to a counter-prediction flow
    this.toastr.info('Counter prediction feature coming soon!');
    // For now, just view the prediction
    this.viewPrediction(predictionId);
  }

  viewResponses(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId], {
      fragment: 'responses'
    });
  }

  viewOwnResponse(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId], {
      fragment: 'my-response'
    });
  }

  sharePost(predictionId: number): void {
    const url = `${window.location.origin}/prediction-details/${predictionId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Check out this prediction!',
        url: url
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Link copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy link');
      });
    }
  }

  private getMockPosts(): PublishedPost[] {
    return [
      {
        id: 1,
        title: "Premier League 2024/25 Final Rankings",
        description: "Predict the final table for the Premier League season. Who will win the title and who will get relegated?",
        predictionType: "Ranking",
        createdAt: new Date('2024-08-15'),
        endDate: new Date('2025-05-25'),
        author: {
          id: 2,
          displayName: "Football Expert",
          photoUrl: undefined
        },
        categories: [
          { id: 1, name: "Sports" },
          { id: 2, name: "Football" }
        ],
        counterPredictionsCount: 23,
        canCounterPredict: true,
        isActive: true,
        isDraft: false,
        privacyType: "Public",
        notes: "Based on summer transfers and pre-season performance"
      },
      {
        id: 3,
        title: "Oscars 2025 Bingo",
        description: "Will there be surprise wins? Awkward speeches? Play Oscar bingo and see how many you can get!",
        predictionType: "Bingo",
        createdAt: new Date('2024-02-15'),
        endDate: new Date('2025-03-10'),
        author: {
          id: 4,
          displayName: "Movie Buff",
          photoUrl: undefined
        },
        categories: [
          { id: 4, name: "Entertainment" },
          { id: 5, name: "Movies" }
        ],
        counterPredictionsCount: 89,
        canCounterPredict: true,
        isActive: true,
        isDraft: false,
        privacyType: "Public"
      },
      {
        id: 5,
        title: "Tech Stocks Performance 2025",
        description: "Rank the top tech stocks by their expected performance this year. Will AI companies continue to dominate?",
        predictionType: "Ranking",
        createdAt: new Date('2024-01-10'),
        endDate: new Date('2025-12-31'),
        author: {
          id: 6,
          displayName: "Stock Analyst",
          photoUrl: undefined
        },
        categories: [
          { id: 6, name: "Finance" },
          { id: 7, name: "Technology" }
        ],
        counterPredictionsCount: 156,
        canCounterPredict: true,
        isActive: true,
        isDraft: false,
        privacyType: "Public"
      },
      {
        id: 7,
        title: "World Cup 2026 Bingo Card",
        description: "Create your bingo card for the 2026 World Cup! From penalty shootouts to VAR controversies.",
        predictionType: "Bingo",
        createdAt: new Date('2024-03-01'),
        endDate: new Date('2026-07-19'),
        author: {
          id: 8,
          displayName: "Soccer Fan 2026",
          photoUrl: undefined
        },
        categories: [
          { id: 1, name: "Sports" },
          { id: 2, name: "Football" },
          { id: 8, name: "World Cup" }
        ],
        counterPredictionsCount: 67,
        canCounterPredict: true,
        isActive: true,
        isDraft: false,
        privacyType: "Public"
      }
    ];
  }
}
