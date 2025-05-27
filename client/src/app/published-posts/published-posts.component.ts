import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

interface PublishedPost {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  author: any;
  categories: any[];
  counterPredictionsCount: number;
  canCounterPredict: boolean;
  isActive: boolean;
  notes?: string;
}

@Component({
  selector: 'app-published-posts',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <h2 class="text-light mb-1">
            <i class="fa fa-globe me-2"></i>Published Predictions
          </h2>
          <p class="text-light mb-0 opacity-75">
            Discover and counter-predict public predictions from the community
          </p>
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
              <label class="form-label text-light">Status</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="selectedStatus"
                (ngModelChange)="onFilterChange()">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
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

      <!-- Results -->
      <div class="row" *ngIf="publishedPosts.length > 0">
        <div class="col-lg-6 col-xl-4 mb-4" *ngFor="let post of publishedPosts">
          <div class="card bg-dark border-dark h-100" style="cursor: pointer;" (click)="viewPrediction(post.id)">
            <div class="card-header bg-dark border-dark">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h6 class="card-title text-light mb-1">{{ post.title }}</h6>
                  <div class="d-flex align-items-center">
                    <i class="fa"
                       [ngClass]="{
                         'fa-list-ol': post.predictionType === 'Ranking',
                         'fa-sitemap': post.predictionType === 'Bracket',
                         'fa-th': post.predictionType === 'Bingo'
                       }" class="text-primary me-2"></i>
                    <span class="badge bg-primary">{{ post.predictionType }}</span>
                  </div>
                </div>
                <div class="text-end">
                  <span class="badge"
                        [class.bg-success]="post.isActive"
                        [class.bg-warning]="!post.isActive">
                    {{ post.isActive ? 'Active' : 'Ended' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-body">
              <p class="card-text text-light small mb-3">{{ post.description | slice:0:120 }}{{ post.description.length > 120 ? '...' : '' }}</p>

              <!-- Author Info -->
              <div class="d-flex align-items-center mb-3">
                <img *ngIf="post.author.photoUrl" [src]="post.author.photoUrl"
                     class="rounded-circle me-2" width="32" height="32" alt="Author">
                <div>
                  <div class="small text-light">{{ post.author.displayName }}</div>
                  <div class="small text-muted">{{ post.createdAt | date:'short' }}</div>
                </div>
              </div>

              <!-- Categories -->
              <div class="mb-3" *ngIf="post.categories.length > 0">
                <div class="d-flex flex-wrap gap-1">
                  <span *ngFor="let category of post.categories.slice(0, 3)"
                        class="badge bg-secondary small">
                    {{ category.name }}
                  </span>
                  <span *ngIf="post.categories.length > 3"
                        class="badge bg-secondary small">
                    +{{ post.categories.length - 3 }} more
                  </span>
                </div>
              </div>

              <!-- Stats -->
              <div class="d-flex justify-content-between align-items-center">
                <div class="small text-muted">
                  <i class="fa fa-users me-1"></i>
                  {{ post.counterPredictionsCount }} counter predictions
                </div>
                <div *ngIf="post.endDate" class="small text-muted">
                  <i class="fa fa-clock-o me-1"></i>
                  Ends {{ post.endDate | date:'short' }}
                </div>
              </div>
            </div>

            <div class="card-footer bg-transparent border-dark">
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-primary btn-sm" (click)="viewPrediction(post.id); $event.stopPropagation()">
                  <i class="fa fa-eye me-1"></i>View Details
                </button>
                <button
                  *ngIf="post.canCounterPredict"
                  class="btn btn-success btn-sm"
                  (click)="viewPrediction(post.id); $event.stopPropagation()">
                  <i class="fa fa-plus me-1"></i>Counter Predict
                </button>
                <span *ngIf="!post.canCounterPredict && post.isActive" class="small text-muted">
                  Already predicted
                </span>
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
      <div *ngIf="publishedPosts.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-search fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">No Predictions Found</h5>
        <p class="text-muted">Try adjusting your search filters or check back later for new predictions.</p>
        <button class="btn btn-primary" routerLink="/create-prediction">
          <i class="fa fa-plus me-2"></i>Create the First Prediction
        </button>
      </div>

      <!-- Pagination -->
      <div class="d-flex justify-content-center mt-4" *ngIf="publishedPosts.length > 0">
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="currentPage === 1">
              <button class="page-link bg-dark border-secondary text-light" (click)="changePage(currentPage - 1)">
                Previous
              </button>
            </li>
            <li class="page-item"
                *ngFor="let page of getPageNumbers()"
                [class.active]="page === currentPage">
              <button class="page-link bg-dark border-secondary text-light" (click)="changePage(page)">
                {{ page }}
              </button>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages">
              <button class="page-link bg-dark border-secondary text-light" (click)="changePage(currentPage + 1)">
                Next
              </button>
            </li>
          </ul>
        </nav>
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

    .pagination .page-link:hover {
      background-color: #495057;
      border-color: #6c757d;
    }

    .pagination .page-item.active .page-link {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
  `]
})
export class PublishedPostsComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  publishedPosts: PublishedPost[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadPublishedPosts();
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
      if (this.selectedStatus) {
        params.append('status', this.selectedStatus);
      }

      const response = await this.http.get<PublishedPost[]>(
        `${environment.apiUrl}post/published?${params.toString()}`
      ).toPromise();

      if (response) {
        this.publishedPosts = response;
        console.log('Published posts loaded:', this.publishedPosts);
      }
    } catch (error) {
      console.error('Error loading published posts:', error);
      this.toastr.error('Failed to load published predictions');

      // Mock data for development/testing
      this.publishedPosts = this.getMockPosts();
    } finally {
      this.isLoading = false;
    }
  }

  onSearchChange(): void {
    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadPublishedPosts();
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPublishedPosts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadPublishedPosts();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPublishedPosts();
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

  viewPrediction(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId]);
  }

  private getMockPosts(): PublishedPost[] {
    // Mock data for development
    return [
      {
        id: 1,
        title: "Premier League 2024/25 Final Rankings",
        description: "Predict the final table for the Premier League season. Who will win the title and who will get relegated?",
        predictionType: "Ranking",
        createdAt: new Date('2024-08-15'),
        endDate: new Date('2025-05-25'),
        author: {
          id: 1,
          displayName: "John Smith",
          photoUrl: null
        },
        categories: [
          { id: 1, name: "Sports" },
          { id: 2, name: "Football" }
        ],
        counterPredictionsCount: 23,
        canCounterPredict: true,
        isActive: true,
        notes: "Based on summer transfers and pre-season performance"
      },
      {
        id: 2,
        title: "March Madness 2025 Bracket",
        description: "The ultimate college basketball tournament prediction. Can you predict the perfect bracket?",
        predictionType: "Bracket",
        createdAt: new Date('2024-03-01'),
        endDate: new Date('2025-04-08'),
        author: {
          id: 2,
          displayName: "Sarah Johnson",
          photoUrl: null
        },
        categories: [
          { id: 1, name: "Sports" },
          { id: 3, name: "Basketball" }
        ],
        counterPredictionsCount: 156,
        canCounterPredict: true,
        isActive: true
      },
      {
        id: 3,
        title: "Oscars 2025 Bingo",
        description: "Will there be surprise wins? Awkward speeches? Play Oscar bingo and see how many you can get!",
        predictionType: "Bingo",
        createdAt: new Date('2024-02-15'),
        endDate: new Date('2025-03-10'),
        author: {
          id: 3,
          displayName: "Movie Buff",
          photoUrl: null
        },
        categories: [
          { id: 4, name: "Entertainment" },
          { id: 5, name: "Movies" }
        ],
        counterPredictionsCount: 89,
        canCounterPredict: true,
        isActive: true
      }
    ];
  }
}
