import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';

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
    colorCode?: string;
    iconName?: string;
  }[];
  counterPredictionsCount: number;
  canCounterPredict: boolean;
  isActive: boolean;
  notes?: string;
  isDraft: boolean;
  privacyType: string;
  userId: number;
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
  selector: 'app-published-posts',
  standalone: true,
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
              <h4 class="text-light">{{ allPosts.length }}</h4>
              <p class="text-light mb-0">Total Posts</p>
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

      <!-- Enhanced Filters -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <div class="row g-3">
            <!-- Search -->
            <div class="col-md-3">
              <label class="form-label text-light">Search</label>
              <input
                type="text"
                class="form-control bg-dark text-light border-secondary"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                placeholder="Search predictions, authors..."
                [value]="searchTerm">
            </div>

            <!-- Category Filter -->
            <div class="col-md-3">
              <label class="form-label text-light">Category</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedCategoryId"
                (change)="onFilterChange()">
                <option value="">All Categories</option>
                <optgroup label="Main Categories" *ngIf="rootCategories.length > 0">
                  <option *ngFor="let category of rootCategories" [value]="category.id">
                    {{ category.name }}
                  </option>
                </optgroup>
                <optgroup label="Subcategories" *ngIf="allSubcategories.length > 0">
                  <option *ngFor="let subcat of allSubcategories" [value]="subcat.id">
                    {{ subcat.parentName }} → {{ subcat.name }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Prediction Type -->
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

            <!-- Sort By -->
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

            <!-- Clear Filters -->
            <div class="col-md-2 d-flex align-items-end">
              <button
                class="btn btn-outline-light w-100"
                (click)="clearFilters()">
                <i class="fa fa-times me-1"></i>Clear Filters
              </button>
            </div>
          </div>

          <!-- Active filters indicator -->
          <div class="mt-3" *ngIf="hasActiveFilters()">
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <small class="text-light opacity-75 me-2">Active filters:</small>

              <span *ngIf="searchTerm" class="badge bg-info d-flex align-items-center">
                <i class="fa fa-search me-1"></i>
                Search: "{{ searchTerm }}"
                <button class="btn btn-sm ms-1 p-0" (click)="clearSearch()" style="background: none; border: none; color: white;">
                  <i class="fa fa-times"></i>
                </button>
              </span>

              <span *ngIf="selectedCategoryId" class="badge bg-success d-flex align-items-center">
                <i class="fa fa-tag me-1"></i>
                Category: {{ getCategoryName(selectedCategoryId) }}
                <button class="btn btn-sm ms-1 p-0" (click)="clearCategoryFilter()" style="background: none; border: none; color: white;">
                  <i class="fa fa-times"></i>
                </button>
              </span>

              <span *ngIf="selectedType" class="badge bg-warning text-dark d-flex align-items-center">
                <i class="fa fa-filter me-1"></i>
                Type: {{ selectedType }}
                <button class="btn btn-sm ms-1 p-0" (click)="clearTypeFilter()" style="background: none; border: none; color: black;">
                  <i class="fa fa-times"></i>
                </button>
              </span>

              <span *ngIf="sortBy !== 'newest'" class="badge bg-secondary d-flex align-items-center">
                <i class="fa fa-sort me-1"></i>
                Sort: {{ getSortDisplayName() }}
                <button class="btn btn-sm ms-1 p-0" (click)="clearSortFilter()" style="background: none; border: none; color: white;">
                  <i class="fa fa-times"></i>
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results counter and pagination info -->
      <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="!isLoading">
        <div class="text-light">
          <span *ngIf="!hasActiveFilters()">
            Showing {{ getDisplayRange() }} of {{ pagination.totalItems }} predictions
          </span>
          <span *ngIf="hasActiveFilters()">
            Showing {{ getDisplayRange() }} of {{ pagination.totalItems }} filtered predictions
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
        <nav aria-label="Predictions pagination">
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

      <!-- Predictions List -->
      <div class="row" *ngIf="paginatedPosts.length > 0">
        <div class="col-lg-6 mb-4" *ngFor="let post of paginatedPosts">
          <div class="card bg-dark border-dark h-100 prediction-card">
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
                    <li *ngIf="canUserCounterPredict(post)">
                      <button class="dropdown-item" (click)="counterPredict(post.id)">
                        <i class="fa fa-plus me-2"></i>Counter Predict
                      </button>
                    </li>
                    <li *ngIf="userHasCounterPredicted(post)">
                      <button class="dropdown-item" (click)="viewMyResponse(post.id)">
                        <i class="fa fa-eye me-2"></i>View My Response
                      </button>
                    </li>
                    <li *ngIf="post.counterPredictionsCount > 0">
                      <button class="dropdown-item" (click)="viewResponses(post.id)">
                        <i class="fa fa-users me-2"></i>View All {{ post.counterPredictionsCount }} Responses
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
                  <!-- Enhanced Response Counter -->
                  <div class="d-flex flex-column align-items-end gap-1">
                    <div class="badge bg-info d-flex align-items-center">
                      <i class="fa fa-users me-1"></i>
                      {{ post.counterPredictionsCount }}
                      {{ post.counterPredictionsCount === 1 ? 'Response' : 'Responses' }}
                    </div>
                    <div class="very-small text-muted" *ngIf="post.counterPredictionsCount > 0">
                      {{ getResponseStatus(post) }}
                    </div>
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
                        class="badge very-small d-flex align-items-center"
                        [style.background-color]="category.colorCode || '#6c757d'"
                        (click)="filterByCategory(category.id)"
                        style="cursor: pointer;">
                    <i *ngIf="category.iconName" class="fa {{ category.iconName }} me-1"></i>
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
                  <!-- Counter Predict Button -->
                  <button *ngIf="canUserCounterPredict(post)"
                          class="btn btn-success btn-sm"
                          (click)="counterPredict(post.id)"
                          [title]="'Create your own prediction for this ' + post.predictionType.toLowerCase()">
                    <i class="fa fa-plus me-1"></i>Counter Predict
                  </button>

                  <!-- View My Response Button -->
                  <button *ngIf="userHasCounterPredicted(post)"
                          class="btn btn-info btn-sm"
                          (click)="viewMyResponse(post.id)"
                          [title]="'View your counter prediction'">
                    <i class="fa fa-eye me-1"></i>My Response
                  </button>

                  <!-- Already Responded Info -->
                  <span *ngIf="userHasCounterPredicted(post) && !canUserCounterPredict(post)"
                        class="btn btn-outline-secondary btn-sm disabled"
                        [title]="'You have already created a counter prediction'">
                    <i class="fa fa-check me-1"></i>Responded
                  </span>

                  <!-- Can't Counter Predict (Own Post) -->
                  <span *ngIf="isOwnPost(post)"
                        class="btn btn-outline-secondary btn-sm disabled"
                        [title]="'This is your own prediction'">
                    <i class="fa fa-user me-1"></i>Your Post
                  </span>

                  <!-- View All Responses Button -->
                  <button *ngIf="post.counterPredictionsCount > 0"
                          class="btn btn-outline-info btn-sm"
                          (click)="viewResponses(post.id)"
                          [title]="'View all ' + post.counterPredictionsCount + ' counter predictions'">
                    <i class="fa fa-users me-1"></i>
                    {{ post.counterPredictionsCount }}
                    {{ post.counterPredictionsCount === 1 ? 'Response' : 'Responses' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls - Bottom -->
      <div class="d-flex justify-content-center mb-4" *ngIf="pagination.totalPages > 1">
        <nav aria-label="Predictions pagination">
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
        <p class="mt-3 text-muted">Loading published predictions...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="paginatedPosts.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-globe fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">
          <span *ngIf="hasActiveFilters()">No predictions match your filters</span>
          <span *ngIf="!hasActiveFilters()">No Active Predictions Found</span>
        </h5>
        <p class="text-muted">
          <span *ngIf="hasActiveFilters()">Try adjusting your search filters or</span>
          <span *ngIf="!hasActiveFilters()">Be the first to create and publish a prediction for others to counter-predict!</span>
        </p>
        <button *ngIf="hasActiveFilters()" class="btn btn-primary me-2" (click)="clearFilters()">
          <i class="fa fa-times me-1"></i>Clear Filters
        </button>
        <button class="btn btn-success" routerLink="/create-prediction">
          <i class="fa fa-plus me-1"></i>Create Prediction
        </button>
      </div>
    </div>
  `,
  styles: [`
    .prediction-card {
      transition: all 0.2s ease;
    }

    .prediction-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
    }

    .very-small {
      font-size: 0.7rem;
    }

    .badge {
      font-size: 0.75rem;
    }

    .btn-group .btn {
      border-radius: 0.25rem;
    }

    .dropdown-menu {
      background-color: #343a40;
      border: 1px solid #495057;
    }

    .dropdown-item {
      color: #fff;
    }

    .dropdown-item:hover {
      background-color: #495057;
      color: #fff;
    }

    .pagination .page-link {
      border-radius: 0.375rem;
      margin: 0 2px;
    }

    .pagination .page-item.active .page-link {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }

    .form-select-sm {
      font-size: 0.875rem;
    }
  `]
})
export class PublishedPostsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);

  // All data
  allPosts: PublishedPost[] = [];
  filteredPosts: PublishedPost[] = [];
  paginatedPosts: PublishedPost[] = [];
  isLoading = false;

  // Pagination
  pagination: PaginationInfo = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  };

  // Category data
  rootCategories: Category[] = [];
  allSubcategories: { id: number, name: string, parentName: string }[] = [];

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedCategoryId: number | string = '';
  sortBy = 'newest';

  private searchTimeout: any;

  // Computed properties
  get totalCounterPredictions(): number {
    return this.allPosts.reduce((sum, p) => sum + p.counterPredictionsCount, 0);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.checkRouteParams();
    this.loadPublishedPosts();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategoryId = +params['category'];
      }
      if (params['type']) {
        this.selectedType = params['type'];
      }
      if (params['search']) {
        this.searchTerm = params['search'];
      }
      if (params['page']) {
        this.pagination.currentPage = +params['page'];
      }
      if (params['size']) {
        this.pagination.pageSize = +params['size'];
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories();
    setTimeout(() => {
      this.rootCategories = this.categoryService.rootCategories();
      this.buildSubcategoriesList();
    }, 100);
  }

  private buildSubcategoriesList(): void {
    this.allSubcategories = [];
    this.rootCategories.forEach(rootCat => {
      if (rootCat.subCategories && rootCat.subCategories.length > 0) {
        rootCat.subCategories.forEach(subCat => {
          this.allSubcategories.push({
            id: subCat.id,
            name: subCat.name,
            parentName: rootCat.name
          });
        });
      }
    });
  }

  async loadPublishedPosts(): Promise<void> {
    this.isLoading = true;
    try {
      console.log('=== Loading Published Posts ===');

      const response = await this.http.get<PublishedPost[]>(
        `${environment.apiUrl}post/published`
      ).toPromise();

      if (response && Array.isArray(response)) {
        this.allPosts = response.map(post => ({
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
          canCounterPredict: post.canCounterPredict !== false,
          isActive: post.isActive !== false,
          isDraft: post.isDraft === true,
          privacyType: post.privacyType || 'Public',
          notes: post.notes || '',
          userId: post.userId || post.author?.id || 0
        }));

        console.log('Processed published posts:', this.allPosts);
        this.applyFiltersAndPagination();

        if (this.allPosts.length > 0) {
          this.toastr.success(`Loaded ${this.allPosts.length} published predictions`);
        } else {
          this.toastr.info('No published predictions found');
        }
      } else {
        this.allPosts = [];
        this.applyFiltersAndPagination();
        this.toastr.warning('No published predictions available');
      }

    } catch (error) {
      console.error('Error loading published posts:', error);
      this.toastr.error('Failed to load published predictions');
      this.allPosts = [];
      this.applyFiltersAndPagination();
    } finally {
      this.isLoading = false;
    }
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
    this.applyFilters();
    this.applyPagination();
  }

  // User interaction methods
  canUserCounterPredict(post: PublishedPost): boolean {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return false;
    if (this.isOwnPost(post)) return false;
    if (!post.isActive || post.isDraft) return false;
    if (this.userHasCounterPredicted(post)) return false;
    return true;
  }

  userHasCounterPredicted(post: PublishedPost): boolean {
    // This would need to be determined from the backend or stored locally
    // For now, we'll return false - you might want to enhance this
    return false;
  }

  isOwnPost(post: PublishedPost): boolean {
    const currentUser = this.accountService.currentUser();
    return currentUser ? post.userId === currentUser.id : false;
  }

  getResponseStatus(post: PublishedPost): string {
    if (post.counterPredictionsCount === 0) {
      return 'No responses yet';
    } else if (post.counterPredictionsCount === 1) {
      return '1 person responded';
    } else if (post.counterPredictionsCount < 5) {
      return `${post.counterPredictionsCount} people responded`;
    } else {
      return `${post.counterPredictionsCount} responses`;
    }
  }

  // Navigation methods
  viewPrediction(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId]);
  }

  counterPredict(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId], {
      queryParams: { action: 'counter-predict' }
    });
  }

  viewResponses(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId], {
      fragment: 'counter-predictions'
    });
  }

  viewMyResponse(predictionId: number): void {
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
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Link copied to clipboard!');
      }).catch(() => {
        this.toastr.error('Failed to copy link');
      });
    }
  }

  // Filter methods
  filterByCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.pagination.currentPage = 1; // Reset to first page
    this.updateUrlParams();
    this.applyFiltersAndPagination();

    const categoryName = this.getCategoryName(categoryId);
    this.toastr.info(`Filtering by category: ${categoryName}`);
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.pagination.currentPage = 1; // Reset to first page
      this.updateUrlParams();
      this.applyFiltersAndPagination();
    }, 300);
  }

  onFilterChange(): void {
    this.pagination.currentPage = 1; // Reset to first page
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedCategoryId = '';
    this.sortBy = 'newest';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId = '';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearTypeFilter(): void {
    this.selectedType = '';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  clearSortFilter(): void {
    this.sortBy = 'newest';
    this.pagination.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndPagination();
  }

  getSortDisplayName(): string {
    switch (this.sortBy) {
      case 'oldest': return 'Oldest First';
      case 'mostResponses': return 'Most Responses';
      case 'endingSoon': return 'Ending Soon';
      case 'alphabetical': return 'A-Z';
      case 'newest':
      default: return 'Newest First';
    }
  }

  private updateUrlParams(): void {
    const queryParams: any = {};

    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedCategoryId) queryParams.category = this.selectedCategoryId;
    if (this.selectedType) queryParams.type = this.selectedType;
    if (this.sortBy && this.sortBy !== 'newest') queryParams.sort = this.sortBy;
    if (this.pagination.currentPage > 1) queryParams.page = this.pagination.currentPage;
    if (this.pagination.pageSize !== 10) queryParams.size = this.pagination.pageSize;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private applyFilters(): void {
    let filtered = [...this.allPosts];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(post => {
        return post.title.toLowerCase().includes(searchLower) ||
               post.description.toLowerCase().includes(searchLower) ||
               post.author.displayName.toLowerCase().includes(searchLower);
      });
    }

    // Apply category filter
    if (this.selectedCategoryId && this.selectedCategoryId !== '') {
      const categoryId = typeof this.selectedCategoryId === 'string' ?
        parseInt(this.selectedCategoryId) : this.selectedCategoryId;

      filtered = filtered.filter(post => {
        return post.categories.some(cat => cat.id === categoryId);
      });
    }

    // Apply type filter
    if (this.selectedType && this.selectedType !== '') {
      filtered = filtered.filter(post => {
        return post.predictionType === this.selectedType;
      });
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
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchTerm && this.searchTerm.trim() !== '') ||
      (this.selectedCategoryId && this.selectedCategoryId !== '') ||
      (this.selectedType && this.selectedType !== '') ||
      (this.sortBy && this.sortBy !== 'newest')
    );
  }

  // Helper methods
  getCategoryName(categoryId: number | string): string {
    if (!categoryId) return '';

    const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;

    const rootCategory = this.rootCategories.find(cat => cat.id === id);
    if (rootCategory) {
      return rootCategory.name;
    }

    const subcategory = this.allSubcategories.find(sub => sub.id === id);
    if (subcategory) {
      return `${subcategory.parentName} → ${subcategory.name}`;
    }

    return 'Unknown Category';
  }

  getRankingCount(): number {
    return this.allPosts.filter(p => p.predictionType === 'Ranking').length;
  }

  getBingoCount(): number {
    return this.allPosts.filter(p => p.predictionType === 'Bingo').length;
  }

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

      return undefined;
    } catch (error) {
      console.error('Error parsing date:', dateValue, error);
      return undefined;
    }
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
}
