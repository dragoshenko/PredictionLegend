import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

interface UserPost {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  isDraft: boolean;
  isActive: boolean;
  counterPredictionsCount: number;
  notes?: string;
  privacyType: string;
  author?: any;
  categories?: any[];
  isCounterPrediction: boolean;
  originalPredictionId?: number;
  originalTitle?: string;
  originalAuthor?: any;
  counterPredictionType?: string;
}

interface CounterPrediction {
  id: number;
  originalPredictionId: number;
  originalTitle: string;
  originalAuthor: any;
  predictionType: string;
  createdAt: Date;
  totalScore: number;
  isCounterPrediction: boolean;
  counterPredictionType: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-user me-2"></i>My Predictions
              </h2>
              <p class="text-light mb-0 opacity-75">
                Manage your predictions and counter predictions
              </p>
            </div>
            <button class="btn btn-outline-light" routerLink="/create-prediction">
              <i class="fa fa-plus me-2"></i>Create New Prediction
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-2 mb-3">
          <div class="card bg-success border-success">
            <div class="card-body text-center">
              <i class="fa fa-check-circle fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ publishedCount }}</h4>
              <p class="text-light mb-0">Published</p>
            </div>
          </div>
        </div>
        <div class="col-md-2 mb-3">
          <div class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-edit fa-2x text-dark mb-2"></i>
              <h4 class="text-dark">{{ draftCount }}</h4>
              <p class="text-dark mb-0">Drafts</p>
            </div>
          </div>
        </div>
        <div class="col-md-2 mb-3">
          <div class="card bg-info border-info">
            <div class="card-body text-center">
              <i class="fa fa-users fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ totalCounterPredictions }}</h4>
              <p class="text-light mb-0">Total Responses</p>
            </div>
          </div>
        </div>
        <div class="col-md-2 mb-3">
          <div class="card bg-secondary border-secondary">
            <div class="card-body text-center">
              <i class="fa fa-clock-o fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ activeCount }}</h4>
              <p class="text-light mb-0">Active</p>
            </div>
          </div>
        </div>
        <!-- NEW: Counter Predictions Stats -->
        <div class="col-md-2 mb-3">
          <div class="card bg-primary border-primary">
            <div class="card-body text-center">
              <i class="fa fa-reply fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ counterPredictionsCount }}</h4>
              <p class="text-light mb-0 small">Counter Predictions</p>
            </div>
          </div>
        </div>
        <div class="col-md-2 mb-3">
          <div class="card bg-dark border-dark">
            <div class="card-body text-center">
              <i class="fa fa-chart-bar fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ totalPosts }}</h4>
              <p class="text-light mb-0">Total Posts</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label text-light">Search</label>
              <input
                type="text"
                class="form-control bg-dark text-light border-secondary"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                placeholder="Search your predictions..."
                [value]="searchTerm">
            </div>

            <!-- NEW: Post Type Filter -->
            <div class="col-md-2">
              <label class="form-label text-light">Post Type</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedPostType"
                (change)="onFilterChange()">
                <option value="">All Posts</option>
                <option value="original">My Predictions</option>
                <option value="counter">Counter Predictions</option>
              </select>
            </div>

            <div class="col-md-2">
              <label class="form-label text-light">Type</label>
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
            <div class="col-md-2">
              <label class="form-label text-light">Status</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedStatus"
                (change)="onFilterChange()">
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label text-light">Sort By</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="sortBy"
                (change)="onFilterChange()">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostResponses">Most Responses</option>
                <option value="endingSoon">Ending Soon</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
            <div class="col-md-1 d-flex align-items-end">
              <button
                class="btn btn-outline-light w-100"
                (click)="clearFilters()">
                <i class="fa fa-times me-1"></i>Clear
              </button>
            </div>
          </div>

          <!-- Active filters indicator -->
          <div class="mt-2" *ngIf="hasActiveFilters()">
            <small class="text-light opacity-75">
              Active filters:
              <span *ngIf="searchTerm" class="badge bg-info me-1">Search: "{{ searchTerm }}"</span>
              <span *ngIf="selectedPostType" class="badge bg-info me-1">Post Type: {{ getPostTypeDisplayName() }}</span>
              <span *ngIf="selectedType" class="badge bg-info me-1">Type: {{ selectedType }}</span>
              <span *ngIf="selectedStatus" class="badge bg-info me-1">Status: {{ selectedStatus }}</span>
              <span *ngIf="sortBy !== 'newest'" class="badge bg-info me-1">Sort: {{ getSortDisplayName() }}</span>
            </small>
          </div>
        </div>
      </div>

      <!-- Results counter and pagination info -->
      <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="!isLoading">
        <div class="text-light">
          <span *ngIf="!hasActiveFilters()">
            Showing {{ getDisplayRange() }} of {{ pagination.totalItems }} posts
            ({{ originalPredictionsCount }} predictions + {{ counterPredictionsCount }} counter predictions)
          </span>
          <span *ngIf="hasActiveFilters()">
            Showing {{ getDisplayRange() }} of {{ pagination.totalItems }} filtered posts
            <span class="text-muted">({{ allPosts.length }} total)</span>
          </span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <!-- Page size selector -->
          <select
            class="form-select form-select-sm bg-dark text-light border-secondary"
            [(ngModel)]="pagination.pageSize"
            (change)="onPageSizeChange()"
            style="width: auto;">
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Pagination Controls - Top -->
      <div class="d-flex justify-content-center mb-4" *ngIf="pagination.totalPages > 1">
        <nav aria-label="My predictions pagination">
          <ul class="pagination pagination-sm">
            <!-- First and Previous -->
            <li class="page-item" [class.disabled]="!pagination.hasPrevious">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(1)"
                      [disabled]="!pagination.hasPrevious">
                <i class="fa fa-angle-double-left"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasPrevious">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.currentPage - 1)"
                      [disabled]="!pagination.hasPrevious">
                <i class="fa fa-angle-left"></i>
              </button>
            </li>

            <!-- Page Numbers -->
            <li *ngFor="let page of getVisiblePages()"
                class="page-item"
                [class.active]="page === pagination.currentPage">
              <button class="page-link"
                      [class.bg-primary]="page === pagination.currentPage"
                      [class.bg-dark]="page !== pagination.currentPage"
                      [class.text-white]="true"
                      [class.border-secondary]="page !== pagination.currentPage"
                      [class.border-primary]="page === pagination.currentPage"
                      (click)="goToPage(page)">
                {{ page }}
              </button>
            </li>

            <!-- Next and Last -->
            <li class="page-item" [class.disabled]="!pagination.hasNext">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.currentPage + 1)"
                      [disabled]="!pagination.hasNext">
                <i class="fa fa-angle-right"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasNext">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.totalPages)"
                      [disabled]="!pagination.hasNext">
                <i class="fa fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Enhanced Predictions List -->
      <div class="row" *ngIf="paginatedPosts.length > 0">
        <div class="col-lg-6 mb-4" *ngFor="let post of paginatedPosts">
          <div class="card bg-dark border-dark h-100"
               [class.border-primary]="post.isCounterPrediction">
            <div class="card-header bg-dark border-dark">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <!-- Enhanced title for counter predictions -->
                  <h6 class="card-title text-light mb-1">
                    <span *ngIf="!post.isCounterPrediction">{{ post.title }}</span>
                    <span *ngIf="post.isCounterPrediction">
                      <i class="fa fa-reply text-primary me-1"></i>
                      Counter to: "{{ post.originalTitle }}"
                    </span>
                  </h6>

                  <div class="d-flex align-items-center gap-2">
                    <i class="fa"
                       [ngClass]="{
                         'fa-list-ol': getPredictionType(post) === 'Ranking',
                         'fa-sitemap': getPredictionType(post) === 'Bracket',
                         'fa-th': getPredictionType(post) === 'Bingo'
                       }" class="text-primary me-1"></i>
                    <span class="badge bg-primary">{{ getPredictionType(post) }}</span>

                    <!-- Counter prediction badge -->
                    <span *ngIf="post.isCounterPrediction" class="badge bg-info">
                      <i class="fa fa-reply me-1"></i>Counter Prediction
                    </span>

                    <!-- Status badges for original predictions -->
                    <span *ngIf="!post.isCounterPrediction" class="badge"
                          [class.bg-success]="!post.isDraft && post.isActive"
                          [class.bg-warning]="post.isDraft"
                          [class.bg-secondary]="!post.isDraft && !post.isActive">
                      {{ getStatusText(post) }}
                    </span>

                    <span *ngIf="!post.isCounterPrediction" class="badge bg-info">{{ post.privacyType || 'Public' }}</span>
                  </div>

                  <!-- Original author for counter predictions -->
                  <div *ngIf="post.isCounterPrediction" class="mt-1">
                    <small class="text-muted">
                      Original by: {{ post.originalAuthor?.displayName || 'Unknown' }}
                    </small>
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
                      <button class="dropdown-item" (click)="viewPrediction(post)">
                        <i class="fa fa-eye me-2"></i>View Details
                      </button>
                    </li>

                    <!-- Counter prediction specific actions -->
                    <li *ngIf="post.isCounterPrediction">
                      <button class="dropdown-item" (click)="viewOriginalPrediction(post)">
                        <i class="fa fa-external-link me-2"></i>View Original
                      </button>
                    </li>

                    <!-- Original prediction specific actions -->
                    <li *ngIf="!post.isCounterPrediction && post.isDraft">
                      <button class="dropdown-item" (click)="editPrediction(post.id)">
                        <i class="fa fa-edit me-2"></i>Continue Editing
                      </button>
                    </li>
                    <li *ngIf="!post.isCounterPrediction && post.isDraft">
                      <button class="dropdown-item" (click)="publishPrediction(post.id)">
                        <i class="fa fa-globe me-2"></i>Publish
                      </button>
                    </li>
                    <li *ngIf="!post.isCounterPrediction && !post.isDraft">
                      <button class="dropdown-item" (click)="duplicatePrediction(post.id)">
                        <i class="fa fa-copy me-2"></i>Duplicate
                      </button>
                    </li>

                    <li>
                      <hr class="dropdown-divider">
                    </li>
                    <li>
                      <button class="dropdown-item text-danger" (click)="deletePrediction(post)">
                        <i class="fa fa-trash me-2"></i>Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="card-body">
              <!-- Description -->
              <p class="card-text text-light small mb-3" *ngIf="post.description">
                {{ post.description | slice:0:120 }}{{ post.description.length > 120 ? '...' : '' }}
              </p>

              <!-- Categories for original predictions -->
              <div class="mb-3" *ngIf="!post.isCounterPrediction && post.categories && post.categories.length > 0">
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

              <div class="row">
                <div class="col-8">
                  <div class="small text-muted mb-2">
                    Created: {{ formatDate(post.createdAt) }}
                  </div>
                  <div *ngIf="!post.isCounterPrediction && post.endDate" class="small text-muted mb-2">
                    <i class="fa fa-clock-o me-1"></i>
                    Ends: {{ formatDate(post.endDate) }}
                  </div>
                  <div *ngIf="post.notes" class="small text-light">
                    <strong>Notes:</strong> {{ post.notes | slice:0:100 }}{{ post.notes.length > 100 ? '...' : '' }}
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="d-flex flex-column align-items-end">
                    <!-- Counter predictions count for original predictions -->
                    <div *ngIf="!post.isCounterPrediction" class="badge bg-info mb-2">
                      <i class="fa fa-users me-1"></i>
                      {{ post.counterPredictionsCount }}
                    </div>
                    <div *ngIf="!post.isCounterPrediction" class="small text-muted">
                      {{ post.counterPredictionsCount === 1 ? 'Response' : 'Responses' }}
                    </div>

                    <div class="small text-muted mt-1" *ngIf="!post.isCounterPrediction && post.endDate">
                      {{ getDaysUntilEnd(post.endDate) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer bg-transparent border-dark">
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-primary btn-sm" (click)="viewPrediction(post)">
                  <i class="fa fa-eye me-1"></i>
                  {{ post.isCounterPrediction ? 'View My Response' : (post.isDraft ? 'Preview' : 'View') }}
                </button>

                <div class="btn-group">
                  <!-- Original prediction actions -->
                  <button *ngIf="!post.isCounterPrediction && post.isDraft"
                          class="btn btn-success btn-sm"
                          (click)="editPrediction(post.id)">
                    <i class="fa fa-edit me-1"></i>Continue Editing
                  </button>
                  <button *ngIf="!post.isCounterPrediction && !post.isDraft && post.counterPredictionsCount > 0"
                          class="btn btn-info btn-sm"
                          (click)="viewCounterPredictions(post.id)">
                    <i class="fa fa-users me-1"></i>View Responses
                  </button>

                  <!-- Counter prediction actions -->
                  <button *ngIf="post.isCounterPrediction"
                          class="btn btn-info btn-sm"
                          (click)="viewOriginalPrediction(post)">
                    <i class="fa fa-external-link me-1"></i>View Original
                  </button>

                  <!-- Share button -->
                  <button *ngIf="!post.isDraft"
                          class="btn btn-outline-secondary btn-sm"
                          (click)="sharePost(post)">
                    <i class="fa fa-share me-1"></i>Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls - Bottom -->
      <div class="d-flex justify-content-center mb-4" *ngIf="pagination.totalPages > 1">
        <nav aria-label="My predictions pagination">
          <ul class="pagination">
            <!-- First and Previous -->
            <li class="page-item" [class.disabled]="!pagination.hasPrevious">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(1)"
                      [disabled]="!pagination.hasPrevious">
                <i class="fa fa-angle-double-left"></i> First
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasPrevious">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.currentPage - 1)"
                      [disabled]="!pagination.hasPrevious">
                <i class="fa fa-angle-left"></i> Previous
              </button>
            </li>

            <!-- Page Numbers -->
            <li *ngFor="let page of getVisiblePages()"
                class="page-item"
                [class.active]="page === pagination.currentPage">
              <button class="page-link"
                      [class.bg-primary]="page === pagination.currentPage"
                      [class.bg-dark]="page !== pagination.currentPage"
                      [class.text-white]="true"
                      [class.border-secondary]="page !== pagination.currentPage"
                      [class.border-primary]="page === pagination.currentPage"
                      (click)="goToPage(page)">
                {{ page }}
              </button>
            </li>

            <!-- Next and Last -->
            <li class="page-item" [class.disabled]="!pagination.hasNext">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.currentPage + 1)"
                      [disabled]="!pagination.hasNext">
                Next <i class="fa fa-angle-right"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasNext">
              <button class="page-link bg-dark text-light border-secondary"
                      (click)="goToPage(pagination.totalPages)"
                      [disabled]="!pagination.hasNext">
                Last <i class="fa fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading your predictions...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="paginatedPosts.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-lightbulb-o fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">{{ getEmptyStateTitle() }}</h5>
        <p class="text-muted">{{ getEmptyStateMessage() }}</p>
        <button class="btn btn-primary" routerLink="/create-prediction" *ngIf="!hasActiveFilters()">
          <i class="fa fa-plus me-2"></i>Create Your First Prediction
        </button>
        <button class="btn btn-outline-secondary" (click)="clearFilters()" *ngIf="hasActiveFilters()">
          <i class="fa fa-times me-2"></i>Clear Filters
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./my-predictions.component.css']
})
export class MyPredictionsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  // All data
  allPosts: UserPost[] = [];
  filteredPosts: UserPost[] = [];
  paginatedPosts: UserPost[] = [];
  counterPredictions: CounterPrediction[] = [];
  isLoading = false;
  showDebugInfo = false;
  debugInfo: any = null;

  // Pagination
  pagination: PaginationInfo = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  };

  // Enhanced Filters
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedPostType = ''; // NEW: Filter for original vs counter predictions
  sortBy = 'newest';

  private searchTimeout: any;

  // Enhanced computed properties
  get userPosts(): UserPost[] {
    return this.allPosts;
  }

  get publishedCount(): number {
    return this.allPosts.filter(p => !p.isDraft && !p.isCounterPrediction).length;
  }

  get draftCount(): number {
    return this.allPosts.filter(p => p.isDraft && !p.isCounterPrediction).length;
  }

  get activeCount(): number {
    return this.allPosts.filter(p => !p.isDraft && p.isActive && !p.isCounterPrediction).length;
  }

  get totalCounterPredictions(): number {
    return this.allPosts.filter(p => !p.isCounterPrediction).reduce((sum, p) => sum + p.counterPredictionsCount, 0);
  }

  get counterPredictionsCount(): number {
    return this.allPosts.filter(p => p.isCounterPrediction).length;
  }

  get originalPredictionsCount(): number {
    return this.allPosts.filter(p => !p.isCounterPrediction).length;
  }

  get totalPosts(): number {
    return this.allPosts.length;
  }

  ngOnInit(): void {
    this.checkRouteParams();
    this.loadUserPosts();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
      }
      if (params['type']) {
        this.selectedType = params['type'];
      }
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      if (params['postType']) {
        this.selectedPostType = params['postType'];
      }
      if (params['sort']) {
        this.sortBy = params['sort'];
      }
      if (params['page']) {
        this.pagination.currentPage = +params['page'];
      }
      if (params['size']) {
        this.pagination.pageSize = +params['size'];
      }
    });
  }

  // Pagination Methods
  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;

    this.pagination.currentPage = page;
    this.updateUrlParams();
    this.applyPagination();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(): void {
    this.pagination.currentPage = 1; // Reset to first page
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  getVisiblePages(): number[] {
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push(-1); // Ellipsis indicator
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push(-1); // Ellipsis indicator
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages.filter(page => page !== -1); // Remove ellipsis for now
  }

  getDisplayRange(): string {
    if (this.pagination.totalItems === 0) return '0';

    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize + 1;
    const end = Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalItems);

    return `${start}-${end}`;
  }

  private updatePaginationInfo(): void {
    this.pagination.totalItems = this.filteredPosts.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
    this.pagination.hasNext = this.pagination.currentPage < this.pagination.totalPages;
    this.pagination.hasPrevious = this.pagination.currentPage > 1;

    // Adjust current page if it's out of bounds
    if (this.pagination.currentPage > this.pagination.totalPages && this.pagination.totalPages > 0) {
      this.pagination.currentPage = this.pagination.totalPages;
    }
    if (this.pagination.currentPage < 1) {
      this.pagination.currentPage = 1;
    }
  }

  private applyPagination(): void {
    this.updatePaginationInfo();

    const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    const endIndex = startIndex + this.pagination.pageSize;

    this.paginatedPosts = this.filteredPosts.slice(startIndex, endIndex);
  }

  private applyFiltersAndPagination(): void {
    this.applyFiltersAndSorting();
    this.applyPagination();
  }

  async loadUserPosts(): Promise<void> {
    this.isLoading = true;
    try {
      const currentUser = this.accountService.currentUser();
      if (!currentUser) {
        this.toastr.error('You must be logged in to view your predictions');
        this.router.navigate(['/auth']);
        return;
      }

      console.log('Loading posts for user:', currentUser.id);

      // Load both original predictions and counter predictions
      await Promise.all([
        this.loadOriginalPredictions(),
        this.loadCounterPredictions()
      ]);

      this.applyFiltersAndPagination();

    } catch (error) {
      console.error('Error loading user posts:', error);
      this.toastr.error('Failed to load your predictions');
      this.allPosts = [];
      this.applyFiltersAndPagination();
    } finally {
      this.isLoading = false;
    }
  }

  private async loadOriginalPredictions(): Promise<void> {
    try {
      console.log('Loading original predictions...');

      let response = await this.http.get<any[]>(
        `${environment.apiUrl}post/my-posts`
      ).toPromise().catch(() => null);

      if (!response) {
        const currentUser = this.accountService.currentUser();
        if (currentUser) {
          response = await this.http.get<any[]>(
            `${environment.apiUrl}post/user/${currentUser.id}`
          ).toPromise().catch(() => null);
        }
      }

      if (response && Array.isArray(response)) {
        const originalPosts = response.map(post => ({
          id: post.id,
          title: post.title || 'Untitled Prediction',
          description: post.description || '',
          predictionType: this.getPredictionTypeDisplayName(post.predictionType),
          createdAt: this.parseDate(post.createdAt) || new Date(),
          endDate: this.parseDate(post.endDate),
          isDraft: post.isDraft === true,
          isActive: post.isActive !== false,
          counterPredictionsCount: post.counterPredictionsCount || 0,
          notes: post.notes || post.description || '',
          privacyType: post.privacyType || 'Public',
          author: post.author,
          categories: post.categories || [],
          isCounterPrediction: false
        }));

        this.allPosts = [...originalPosts];
        console.log('Loaded original predictions:', originalPosts.length);
      }
    } catch (error) {
      console.error('Error loading original predictions:', error);
    }
  }

  private async loadCounterPredictions(): Promise<void> {
    try {
      console.log('Loading counter predictions...');

      const response = await this.http.get<CounterPrediction[]>(
        `${environment.apiUrl}post/my-counter-predictions`
      ).toPromise();

      if (response && Array.isArray(response)) {
        const counterPosts = response.map(counter => ({
          id: counter.id,
          title: `Counter to: "${counter.originalTitle}"`,
          description: `Your ${counter.counterPredictionType.toLowerCase()} counter prediction`,
          predictionType: this.getPredictionTypeDisplayName(counter.predictionType),
          createdAt: this.parseDate(counter.createdAt) || new Date(),
          endDate: undefined,
          isDraft: false,
          isActive: true,
          counterPredictionsCount: 0,
          notes: `Counter prediction for "${counter.originalTitle}"`,
          privacyType: 'Public',
          author: undefined,
          categories: [],
          isCounterPrediction: true,
          originalPredictionId: counter.originalPredictionId,
          originalTitle: counter.originalTitle,
          originalAuthor: counter.originalAuthor,
          counterPredictionType: counter.counterPredictionType,
          totalScore: counter.totalScore
        }));

        // Merge with original posts
        this.allPosts = [...this.allPosts, ...counterPosts];
        console.log('Loaded counter predictions:', counterPosts.length);
      }
    } catch (error) {
      console.error('Error loading counter predictions:', error);
      // Don't fail the whole load if counter predictions fail
    }
  }

  // ENHANCED FILTER METHODS
  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      console.log('Search term changed to:', this.searchTerm);
      this.pagination.currentPage = 1; // Reset to first page
      this.updateUrlParams();
      this.applyFiltersAndPagination();
    }, 300);
  }

  onFilterChange(): void {
    console.log('Filter changed - PostType:', this.selectedPostType, 'Type:', this.selectedType, 'Status:', this.selectedStatus, 'Sort:', this.sortBy);
    this.pagination.currentPage = 1; // Reset to first page
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearFilters(): void {
    console.log('Clearing all filters');
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedPostType = '';
    this.sortBy = 'newest';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  private updateUrlParams(): void {
    const queryParams: any = {};

    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedType) queryParams.type = this.selectedType;
    if (this.selectedStatus) queryParams.status = this.selectedStatus;
    if (this.selectedPostType) queryParams.postType = this.selectedPostType;
    if (this.sortBy && this.sortBy !== 'newest') queryParams.sort = this.sortBy;
    if (this.pagination.currentPage > 1) queryParams.page = this.pagination.currentPage;
    if (this.pagination.pageSize !== 10) queryParams.size = this.pagination.pageSize;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  applyFiltersAndSorting(): void {
    console.log('=== Applying Enhanced Filters and Sorting ===');
    console.log('Original posts count:', this.allPosts.length);

    let filtered = [...this.allPosts];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        (post.notes && post.notes.toLowerCase().includes(searchLower)) ||
        (post.originalTitle && post.originalTitle.toLowerCase().includes(searchLower))
      );
    }

    // Apply post type filter (NEW)
    if (this.selectedPostType && this.selectedPostType !== '') {
      switch (this.selectedPostType) {
        case 'original':
          filtered = filtered.filter(post => !post.isCounterPrediction);
          break;
        case 'counter':
          filtered = filtered.filter(post => post.isCounterPrediction);
          break;
      }
    }

    // Apply type filter
    if (this.selectedType && this.selectedType !== '') {
      filtered = filtered.filter(post => post.predictionType === this.selectedType);
    }

    // Apply status filter (only for original predictions)
    if (this.selectedStatus && this.selectedStatus !== '') {
      switch (this.selectedStatus) {
        case 'published':
          filtered = filtered.filter(post => !post.isDraft && !post.isCounterPrediction);
          break;
        case 'draft':
          filtered = filtered.filter(post => post.isDraft && !post.isCounterPrediction);
          break;
        case 'active':
          filtered = filtered.filter(post => !post.isDraft && post.isActive && !post.isCounterPrediction);
          break;
        case 'ended':
          filtered = filtered.filter(post => !post.isDraft && !post.isActive && !post.isCounterPrediction);
          break;
      }
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
        filtered = filtered
          .filter(p => p.endDate)
          .sort((a, b) => {
            if (!a.endDate || !b.endDate) return 0;
            return a.endDate.getTime() - b.endDate.getTime();
          });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    this.filteredPosts = filtered;
    console.log('Filtered posts:', this.filteredPosts.length);
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchTerm && this.searchTerm.trim() !== '') ||
      (this.selectedType && this.selectedType !== '') ||
      (this.selectedStatus && this.selectedStatus !== '') ||
      (this.selectedPostType && this.selectedPostType !== '') ||
      (this.sortBy && this.sortBy !== 'newest')
    );
  }

  // NEW HELPER METHODS
  getPostTypeDisplayName(): string {
    switch (this.selectedPostType) {
      case 'original': return 'My Predictions';
      case 'counter': return 'Counter Predictions';
      default: return this.selectedPostType;
    }
  }

  getSortDisplayName(): string {
    switch (this.sortBy) {
      case 'oldest': return 'Oldest First';
      case 'mostResponses': return 'Most Responses';
      case 'endingSoon': return 'Ending Soon';
      case 'alphabetical': return 'A-Z';
      case 'newest': return 'Newest First';
      default: return this.sortBy;
    }
  }

  getPredictionType(post: UserPost): string {
    return post.counterPredictionType || post.predictionType;
  }

  // ENHANCED NAVIGATION METHODS
  async viewPrediction(post: UserPost): Promise<void> {
    try {
      if (post.isCounterPrediction) {
        // For counter predictions, navigate to counter prediction detail view
        const type = post.counterPredictionType?.toLowerCase() || 'ranking';
        this.router.navigate(['/my-counter-prediction', post.id, type]);
      } else {
        // For original predictions, use the existing my-prediction route
        this.router.navigate(['/my-prediction', post.id]);
      }
    } catch (error) {
      console.error('Error viewing prediction:', error);
      this.toastr.error('Failed to load prediction');
    }
  }

  viewOriginalPrediction(post: UserPost): void {
    if (post.isCounterPrediction && post.originalPredictionId) {
      // Navigate to the original prediction in the public view
      this.router.navigate(['/prediction-details', post.originalPredictionId]);
    }
  }

  sharePost(post: UserPost): void {
    let url: string;

    if (post.isCounterPrediction && post.originalPredictionId) {
      // For counter predictions, share the original prediction
      url = `${window.location.origin}/prediction-details/${post.originalPredictionId}`;
    } else {
      // For original predictions, share the prediction details
      url = `${window.location.origin}/prediction-details/${post.id}`;
    }

    if (navigator.share) {
      const title = post.isCounterPrediction ?
        `Check out this prediction: "${post.originalTitle}"` :
        `Check out my prediction: "${post.title}"`;

      navigator.share({
        title: title,
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

  async deletePrediction(post: UserPost): Promise<void> {
    const confirmMessage = post.isCounterPrediction ?
      'Are you sure you want to delete this counter prediction? This action cannot be undone.' :
      'Are you sure you want to delete this prediction? This action cannot be undone.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      if (post.isCounterPrediction) {
        // Delete counter prediction
        const type = post.counterPredictionType?.toLowerCase() || 'ranking';
        await this.http.delete(`${environment.apiUrl}post/counter-prediction/${post.id}/${type}`).toPromise();
        this.toastr.success('Counter prediction deleted successfully');
      } else {
        // Delete original prediction
        await this.http.delete(`${environment.apiUrl}prediction/${post.id}`).toPromise();
        this.toastr.success('Prediction deleted successfully');
      }

      this.loadUserPosts(); // Reload to remove the deleted item
    } catch (error) {
      console.error('Error deleting:', error);
      this.toastr.error('Failed to delete');
    }
  }

  // EXISTING METHODS (keeping the ones that are still relevant)
  async editPrediction(predictionId: number): Promise<void> {
    try {
      console.log('Loading prediction for editing:', predictionId);
      this.router.navigate(['/create-prediction'], {
        queryParams: { edit: predictionId }
      });
    } catch (error) {
      console.error('Error loading prediction for editing:', error);
      this.toastr.error('Failed to load prediction for editing');
    }
  }

  viewCounterPredictions(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId], {
      fragment: 'counter-predictions'
    });
  }

  async publishPrediction(predictionId: number): Promise<void> {
    if (!confirm('Are you sure you want to publish this prediction? Once published, other users will be able to see and counter-predict it.')) {
      return;
    }

    try {
      await this.http.put(`${environment.apiUrl}prediction/${predictionId}/publish`, {}).toPromise();
      this.toastr.success('Prediction published successfully!');
      this.loadUserPosts();
    } catch (error) {
      console.error('Error publishing prediction:', error);
      this.toastr.error('Failed to publish prediction');
    }
  }

  async duplicatePrediction(predictionId: number): Promise<void> {
    if (!confirm('This will create a copy of your prediction as a new draft. Continue?')) {
      return;
    }

    try {
      const response = await this.http.post(`${environment.apiUrl}prediction/${predictionId}/duplicate`, {}).toPromise();
      this.toastr.success('Prediction duplicated successfully!');
      this.loadUserPosts();
    } catch (error) {
      console.error('Error duplicating prediction:', error);
      this.toastr.error('Failed to duplicate prediction');
    }
  }

  // STATUS AND FORMATTING METHODS
  getStatusText(post: UserPost): string {
    if (post.isDraft) return 'Draft';
    if (post.isActive) return 'Active';
    return 'Ended';
  }

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

  // HELPER METHODS
  private getPredictionTypeDisplayName(predictionType: any): string {
    if (typeof predictionType === 'string') {
      return predictionType;
    }

    switch (predictionType) {
      case 0: case '0': return 'Ranking';
      case 1: case '1': return 'Bracket';
      case 2: case '2': return 'Bingo';
      default: return 'Unknown';
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

  // EMPTY STATE METHODS
  getEmptyStateTitle(): string {
    if (this.hasActiveFilters()) {
      return 'No posts match your filters';
    }

    if (this.allPosts.length === 0) {
      return 'No Predictions Yet';
    }

    switch (this.selectedStatus) {
      case 'published': return 'No Published Predictions';
      case 'draft': return 'No Draft Predictions';
      case 'active': return 'No Active Predictions';
      case 'ended': return 'No Ended Predictions';
      default: return 'No Posts Found';
    }
  }

  getEmptyStateMessage(): string {
    if (this.hasActiveFilters()) {
      return 'Try adjusting your search filters to find what you\'re looking for.';
    }

    if (this.allPosts.length === 0) {
      return 'Start by creating your first prediction and see how others respond!';
    }

    switch (this.selectedStatus) {
      case 'published':
        return 'You haven\'t published any predictions yet. Publish your drafts to let others counter-predict!';
      case 'draft':
        return 'You don\'t have any draft predictions. Start creating one to save your progress.';
      case 'active':
        return 'You don\'t have any active predictions. Published predictions that haven\'t ended will appear here.';
      case 'ended':
        return 'You don\'t have any ended predictions yet.';
      default:
        return 'Create your first prediction to get started!';
    }
  }
}
