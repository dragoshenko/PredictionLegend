// published-posts.component.ts - COMPLETE UPDATED VERSION

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
                (input)="onSearchChange()"
                placeholder="Search predictions, authors..."
                [value]="searchTerm">
            </div>
            <div class="col-md-3">
              <label class="form-label text-light">Prediction Type</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedType"
                (change)="onFilterChange()">
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
                (change)="onFilterChange()">
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
                <i class="fa fa-times me-1"></i>Clear Filters
              </button>
            </div>
          </div>

          <!-- Active filters indicator -->
          <div class="mt-2" *ngIf="hasActiveFilters()">
            <small class="text-light opacity-75">
              Active filters:
              <span *ngIf="searchTerm" class="badge bg-info me-1">Search: "{{ searchTerm }}"</span>
              <span *ngIf="selectedType" class="badge bg-info me-1">Type: {{ selectedType }}</span>
              <span *ngIf="sortBy !== 'newest'" class="badge bg-info me-1">Sort: {{ sortBy }}</span>
            </small>
          </div>
        </div>
      </div>

      <!-- Results counter -->
      <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="!isLoading">
        <div class="text-light">
          <span *ngIf="!hasActiveFilters()">
            Showing {{ filteredPosts.length }} published predictions
          </span>
          <span *ngIf="hasActiveFilters()">
            Showing {{ filteredPosts.length }} of {{ publishedPosts.length }} predictions
          </span>
        </div>
        <div class="text-muted small" *ngIf="hasActiveFilters()">
          <button class="btn btn-sm btn-outline-secondary" (click)="clearFilters()">
            <i class="fa fa-times me-1"></i>Clear all filters
          </button>
        </div>
      </div>

      <!-- Predictions List -->
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
                <div class="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                     *ngIf="!post.author.photoUrl"
                     style="width: 32px; height: 32px;">
                  <i class="fa fa-user text-white"></i>
                </div>
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
        <h5 class="text-muted">
          <span *ngIf="hasActiveFilters()">No predictions match your filters</span>
          <span *ngIf="!hasActiveFilters()">No Active Predictions Found</span>
        </h5>
        <p class="text-muted">
          <span *ngIf="hasActiveFilters()">Try adjusting your search filters or</span>
          <span *ngIf="!hasActiveFilters()">Be the first to create and publish a prediction for others to counter-predict!</span>
        </p>
        <button class="btn btn-primary" routerLink="/create-prediction" *ngIf="!hasActiveFilters()">
          <i class="fa fa-plus me-2"></i>Create the First Public Prediction
        </button>
        <button class="btn btn-outline-secondary" (click)="clearFilters()" *ngIf="hasActiveFilters()">
          <i class="fa fa-times me-2"></i>Clear Filters
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

  // MAIN DATA LOADING METHOD
  async loadPublishedPosts(): Promise<void> {
    this.isLoading = true;
    try {
      console.log('=== Loading Published Posts (Simplified Direct API Call) ===');

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

      const apiUrl = `${environment.apiUrl}post/published?${params.toString()}`;
      console.log('Calling API:', apiUrl);

      // Direct API call - don't use fallbacks, just get the real data
      const response = await this.http.get<PublishedPost[]>(apiUrl).toPromise();

      console.log('Raw API response:', response);
      this.debugRawData = response;

      if (response && Array.isArray(response)) {
        // Process the response directly
        this.publishedPosts = response.map(post => {
          console.log('Processing post:', post); // Debug log

          const processedPost = {
            id: post.id,
            title: post.title || 'Untitled',
            description: post.description || '',
            predictionType: this.getPredictionTypeDisplayName(post.predictionType),
            createdAt: this.parseDate(post.createdAt) || new Date(),
            endDate: this.parseDate(post.endDate),
            author: {
              id: post.author?.id || 0,
              displayName: post.author?.displayName || 'Unknown Author',
              photoUrl: post.author?.photoUrl
            },
            categories: post.categories || [],
            counterPredictionsCount: post.counterPredictionsCount || 0,
            canCounterPredict: this.determineCanCounterPredict(post),
            isActive: post.isActive !== false,
            isDraft: post.isDraft === true,
            privacyType: post.privacyType || 'Public',
            notes: post.notes || ''
          };

          // Debug log to check date parsing
          console.log(`Post ${post.id} dates:`, {
            originalCreatedAt: post.createdAt,
            parsedCreatedAt: processedPost.createdAt,
            originalEndDate: post.endDate,
            parsedEndDate: processedPost.endDate
          });

          return processedPost;
        });

        console.log('Processed published posts:', this.publishedPosts);
        this.applyFiltersAndSorting();

        if (this.publishedPosts.length > 0) {
          this.toastr.success(`Loaded ${this.publishedPosts.length} published predictions`);
        } else {
          console.log('API returned empty array');
          this.toastr.info('No published predictions found');
        }
      } else {
        console.log('API response is not an array:', response);
        this.publishedPosts = [];
        this.applyFiltersAndSorting();
        this.toastr.warning('No published predictions available');
      }

    } catch (error) {
      console.error('Error loading published posts:', error);

      // Log the full error details
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Show specific error message
      let errorMessage = 'Failed to load published predictions';
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.status === 0) {
          errorMessage = 'Cannot connect to server. Is the API running?';
        } else if (errorObj.status >= 400 && errorObj.status < 500) {
          errorMessage = `Client error (${errorObj.status}): ${errorObj.message || 'Bad request'}`;
        } else if (errorObj.status >= 500) {
          errorMessage = `Server error (${errorObj.status}): ${errorObj.message || 'Internal server error'}`;
        }
      }

      this.toastr.error(errorMessage);
      this.publishedPosts = [];
      this.applyFiltersAndSorting();
    } finally {
      this.isLoading = false;
    }
  }

  // HELPER METHODS
  private getPredictionTypeDisplayName(predictionType: any): string {
    if (typeof predictionType === 'string') {
      return predictionType;
    }

    switch (predictionType) {
      case 0:
      case '0':
        return 'Ranking';
      case 1:
      case '1':
        return 'Bracket';
      case 2:
      case '2':
        return 'Bingo';
      default:
        return 'Unknown';
    }
  }

  private parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;

    try {
      if (dateValue instanceof Date) {
        return new Date(dateValue.getTime());
      }

      if (typeof dateValue === 'string') {
        let dateString = dateValue.trim();

        if (dateString === '0001-01-01T00:00:00' || dateString.startsWith('0001-01-01')) {
          return undefined;
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

  private determineCanCounterPredict(post: any): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return false;
    if (post.author.id === currentUser.id) return false;
    return post.isActive && !post.isDraft;
  }

  // FILTER AND SEARCH METHODS
  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      console.log('Search term changed to:', this.searchTerm);
      this.currentPage = 1;
      this.applyFiltersAndSorting();
    }, 300);
  }

  onFilterChange(): void {
    console.log('Filter changed - Type:', this.selectedType, 'Sort:', this.sortBy);
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  clearFilters(): void {
    console.log('Clearing all filters');
    this.searchTerm = '';
    this.selectedType = '';
    this.sortBy = 'newest';
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting(): void {
    console.log('=== Applying Filters and Sorting ===');
    console.log('Original posts count:', this.publishedPosts.length);
    console.log('Search term:', this.searchTerm);
    console.log('Selected type:', this.selectedType);
    console.log('Sort by:', this.sortBy);

    let filtered = [...this.publishedPosts];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      console.log('Applying search filter for:', searchLower);

      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(searchLower);
        const descriptionMatch = post.description.toLowerCase().includes(searchLower);
        const authorMatch = post.author.displayName.toLowerCase().includes(searchLower);

        const matches = titleMatch || descriptionMatch || authorMatch;

        if (matches) {
          console.log(`Post "${post.title}" matches search term`);
        }

        return matches;
      });

      console.log('After search filter:', filtered.length, 'posts');
    }

    // Apply type filter
    if (this.selectedType && this.selectedType !== '' && this.selectedType !== 'All Types') {
      console.log('Applying type filter for:', this.selectedType);

      filtered = filtered.filter(post => {
        const typeMatch = post.predictionType === this.selectedType ||
                         post.predictionType.toString() === this.selectedType;

        if (typeMatch) {
          console.log(`Post "${post.title}" matches type filter`);
        }

        return typeMatch;
      });

      console.log('After type filter:', filtered.length, 'posts');
    }

    // Apply sorting
    console.log('Applying sort:', this.sortBy);
    switch (this.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'mostResponses':
        filtered.sort((a, b) => b.counterPredictionsCount - a.counterPredictionsCount);
        break;
      case 'endingSoon':
        filtered = filtered
          .filter(p => p.endDate)
          .sort((a, b) => {
            if (!a.endDate || !b.endDate) return 0;
            return a.endDate.getTime() - b.endDate.getTime();
          });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    // Remove duplicates by ID
    this.filteredPosts = filtered.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    );

    // Update pagination
    this.totalPosts = this.filteredPosts.length;
    this.totalPages = Math.ceil(this.totalPosts / this.pageSize);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    console.log('=== Filter Results ===');
    console.log('Filtered posts:', this.filteredPosts.length);
    console.log('Total pages:', this.totalPages);
    console.log('Current page:', this.currentPage);

    this.filteredPosts.forEach(post => {
      console.log(`- ${post.title} (${post.predictionType}) by ${post.author.displayName}`);
    });
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchTerm && this.searchTerm.trim() !== '') ||
      (this.selectedType && this.selectedType !== '' && this.selectedType !== 'All Types') ||
      (this.sortBy && this.sortBy !== 'newest')
    );
  }

  // STATS METHODS
  getRankingCount(): number {
    return this.publishedPosts.filter(p =>
      p.predictionType === 'Ranking' ||
      p.predictionType === '0'
    ).length;
  }

  getBingoCount(): number {
    return this.publishedPosts.filter(p =>
      p.predictionType === 'Bingo' ||
      p.predictionType === '2'
    ).length;
  }

  getBracketCount(): number {
    return this.publishedPosts.filter(p =>
      p.predictionType === 'Bracket' ||
      p.predictionType === '1'
    ).length;
  }

  // PAGINATION METHODS
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log('Changing to page:', page);
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

  // DATE METHODS
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

  // NAVIGATION METHODS
  viewPrediction(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId]);
  }

  counterPredict(predictionId: number): void {
    this.toastr.info('Counter prediction feature coming soon!');
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

  canViewOwnResponse(post: PublishedPost): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return false;
    return false; // This would need API support to check if user has already responded
  }

  sharePost(predictionId: number): void {
    const url = `${window.location.origin}/prediction-details/${predictionId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Check out this prediction!',
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
}
