// categories.component.ts - OnPush Change Detection Strategy
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';
import { ToastrService } from 'ngx-toastr';

// Extended interface for UI state
interface CategoryWithUI extends Category {
  expanded?: boolean;
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush strategy
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-tags me-2"></i>Categories & Topics
              </h2>
              <p class="text-light mb-0 opacity-75">
                Explore prediction categories and discover what interests you most
              </p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light" (click)="toggleViewMode()">
                <i class="fa" [class.fa-th-list]="viewMode === 'grid'" [class.fa-th-large]="viewMode === 'list'"></i>
                {{ viewMode === 'grid' ? 'List View' : 'Grid View' }}
              </button>
              <button class="btn btn-outline-light" routerLink="/create-prediction">
                <i class="fa fa-plus me-2"></i>Create Prediction
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card bg-success border-success">
            <div class="card-body text-center">
              <i class="fa fa-tags fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ getTotalCategories() }}</h4>
              <p class="text-light mb-0">Total Categories</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-info border-info">
            <div class="card-body text-center">
              <i class="fa fa-sitemap fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ rootCategories.length }}</h4>
              <p class="text-light mb-0">Main Categories</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-tag fa-2x text-dark mb-2"></i>
              <h4 class="text-dark">{{ getTotalSubcategories() }}</h4>
              <p class="text-dark mb-0">Subcategories</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-secondary border-secondary">
            <div class="card-body text-center">
              <i class="fa fa-search fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ filteredCategories.length }}</h4>
              <p class="text-light mb-0">Showing</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label text-light">Search Categories</label>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control bg-dark text-light border-secondary"
                  [(ngModel)]="searchTerm"
                  (ngModelChange)="onSearchChange()"
                  placeholder="Search categories and subcategories...">
                <button class="btn btn-outline-light" type="button" (click)="clearSearch()">
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label text-light">Filter</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="filterType"
                (ngModelChange)="onFilterChange()">
                <option value="all">All Categories</option>
                <option value="main">Main Categories Only</option>
                <option value="sub">Subcategories Only</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label text-light">Sort By</label>
              <select
                class="form-select bg-dark text-light border-secondary"
                [(ngModel)]="sortBy"
                (ngModelChange)="onFilterChange()">
                <option value="name">Name (A-Z)</option>
                <option value="nameDesc">Name (Z-A)</option>
                <option value="subcategories">Most Subcategories</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Display -->
      <div class="categories-container" *ngIf="filteredCategories.length > 0">
        <div class="category-row mb-4" *ngFor="let category of filteredCategories; trackBy: trackByCategory">
          <!-- Main Category Card -->
          <div class="card bg-gradient border-0 category-main-card"
               [style.background]="getCategoryGradient(category)"
               (click)="selectCategory(category)">
            <div class="card-body p-4">
              <div class="row align-items-center">
                <!-- Category Icon and Info -->
                <div class="col-md-8">
                  <div class="d-flex align-items-center">
                    <div class="category-icon-container me-4"
                         [style.background-color]="category.colorCode || '#6c757d'">
                      <i class="fa fa-2x text-white"
                         [ngClass]="category.iconName || 'fa-tag'"></i>
                    </div>
                    <div class="flex-grow-1">
                      <h3 class="text-white mb-2 fw-bold">{{ category.name }}</h3>
                      <p class="text-white-50 mb-2" *ngIf="category.description">
                        {{ category.description }}
                      </p>
                      <div class="d-flex flex-wrap gap-2">
                        <span class="badge bg-light text-dark">
                          <i class="fa fa-tag me-1"></i>Main Category
                        </span>
                        <span class="badge bg-light text-dark" *ngIf="category.subCategories && category.subCategories.length > 0">
                          <i class="fa fa-sitemap me-1"></i>{{ category.subCategories.length }} Subcategories
                        </span>
                        <span class="badge bg-warning text-dark">
                          <i class="fa fa-chart-line me-1"></i>{{ getRandomPredictionCount() }} Predictions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="col-md-4 text-end">
                  <div class="btn-group">
                    <button class="btn btn-light btn-lg" (click)="exploreCategory(category); $event.stopPropagation()">
                      <i class="fa fa-search me-2"></i>Explore
                    </button>
                    <button class="btn btn-outline-light btn-lg" (click)="createInCategory(category); $event.stopPropagation()">
                      <i class="fa fa-plus me-2"></i>Create
                    </button>
                  </div>
                </div>
              </div>

              <!-- Subcategories Section -->
              <div class="subcategories-section mt-4" *ngIf="category.subCategories && category.subCategories.length > 0 && category.expanded">
                <hr class="text-white-50 mb-3">
                <h5 class="text-white mb-3">
                  <i class="fa fa-sitemap me-2"></i>Subcategories
                </h5>
                <div class="row">
                  <div class="col-md-4 mb-3" *ngFor="let subCategory of category.subCategories; trackBy: trackByCategory">
                    <div class="card bg-dark bg-opacity-75 border-light border-opacity-25 subcategory-card h-100"
                         (click)="selectSubcategory(subCategory); $event.stopPropagation()">
                      <div class="card-body p-3">
                        <div class="d-flex align-items-start">
                          <div class="subcategory-icon me-3"
                               [style.background-color]="subCategory.colorCode || category.colorCode || '#6c757d'">
                            <i class="fa text-white"
                               [ngClass]="subCategory.iconName || category.iconName || 'fa-tag'"></i>
                          </div>
                          <div class="flex-grow-1">
                            <h6 class="text-white mb-1">{{ subCategory.name }}</h6>
                            <p class="text-white-50 small mb-2" *ngIf="subCategory.description">
                              {{ subCategory.description | slice:0:80 }}{{ subCategory.description && subCategory.description.length > 80 ? '...' : '' }}
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                              <span class="badge bg-secondary small">
                                {{ getRandomPredictionCount(true) }} predictions
                              </span>
                              <button class="btn btn-sm btn-outline-light"
                                      (click)="exploreSubcategory(subCategory); $event.stopPropagation()">
                                <i class="fa fa-arrow-right"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expand/Collapse Button -->
              <div class="text-center mt-3" *ngIf="category.subCategories && category.subCategories.length > 0">
                <button class="btn btn-outline-light btn-sm"
                        (click)="toggleCategoryExpansion(category); $event.stopPropagation()">
                  <i class="fa" [class.fa-chevron-down]="!category.expanded" [class.fa-chevron-up]="category.expanded"></i>
                  {{ category.expanded ? 'Hide' : 'Show' }} Subcategories ({{ category.subCategories.length }})
                </button>
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
        <p class="mt-3 text-muted">Loading categories...</p>
        <button class="btn btn-primary mt-3" (click)="forceLoadCategories()">
          <i class="fa fa-refresh me-2"></i>Force Reload
        </button>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredCategories.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-search fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">No Categories Found</h5>
        <p class="text-muted">
          <span *ngIf="searchTerm">No categories match your search "{{ searchTerm }}". Try different keywords.</span>
          <span *ngIf="!searchTerm">Categories are loading or none are available.</span>
        </p>
        <div class="d-flex gap-2 justify-content-center">
          <button class="btn btn-primary" (click)="clearFilters()">
            <i class="fa fa-refresh me-2"></i>Reset Filters
          </button>
          <button class="btn btn-secondary" (click)="forceLoadCategories()">
            <i class="fa fa-download me-2"></i>Force Reload Categories
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-main-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 16px;
      overflow: hidden;
      min-height: 180px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .category-main-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }

    .category-icon-container {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .subcategory-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 12px;
    }

    .subcategory-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
    }

    .subcategory-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .subcategories-section {
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-control, .form-select {
      background-color: #343a40 !important;
      border-color: #6c757d !important;
      color: #fff !important;
    }

    .form-control:focus, .form-select:focus {
      background-color: #343a40 !important;
      border-color: #0d6efd !important;
      color: #fff !important;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    .card {
      border-radius: 12px;
    }

    .text-white-50 {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  `]
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  rootCategories: CategoryWithUI[] = [];
  allCategories: Category[] = [];
  filteredCategories: CategoryWithUI[] = [];

  // UI State
  isLoading = false;
  showDebugInfo = false;
  viewMode: 'grid' | 'list' = 'list';
  hasShownSuccessMessage = false;

  // Filters
  searchTerm = '';
  filterType = 'all';
  sortBy = 'name';

  private searchTimeout: any;
  private loadCheckInterval: any;

  trackByCategory = (index: number, category: CategoryWithUI): number => category.id;

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.loadCheckInterval) {
      clearInterval(this.loadCheckInterval);
    }
  }

  async loadCategories(): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      console.log('Loading categories...');
      this.categoryService.getCategories();

      // Check every 200ms for loaded data
      this.loadCheckInterval = setInterval(() => {
        this.checkForLoadedData();
      }, 200);

      // Stop checking after 10 seconds
      setTimeout(() => {
        if (this.loadCheckInterval) {
          clearInterval(this.loadCheckInterval);
          this.loadCheckInterval = null;
        }
        if (this.rootCategories.length === 0) {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      }, 10000);

    } catch (error) {
      console.error('Error loading categories:', error);
      this.toastr.error('Failed to load categories');
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private checkForLoadedData(): void {
    const serviceCategories = this.categoryService.rootCategories();

    if (serviceCategories.length > 0 && this.rootCategories.length === 0) {
      console.log('Categories detected, updating component...');

      this.rootCategories = serviceCategories.map(category => ({
        ...category,
        expanded: false
      }));

      this.allCategories = this.categoryService.allCategories();
      this.applyFilters();

      if (!this.hasShownSuccessMessage) {
        this.toastr.success(`Loaded ${this.rootCategories.length} categories`);
        this.hasShownSuccessMessage = true;
      }

      this.isLoading = false;

      // Stop the interval
      if (this.loadCheckInterval) {
        clearInterval(this.loadCheckInterval);
        this.loadCheckInterval = null;
      }

      // Trigger change detection
      this.cdr.markForCheck();
    }
  }

  forceLoadCategories(): void {
    console.log('Force loading categories...');
    this.hasShownSuccessMessage = false;
    this.rootCategories = [];
    this.allCategories = [];
    this.filteredCategories = [];
    this.loadCategories();
  }

  applyFilters(): void {
    let filtered = [...this.rootCategories];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category => {
        const matchesMain = category.name.toLowerCase().includes(searchLower) ||
                           (category.description?.toLowerCase().includes(searchLower) || false);

        const matchesSubcategories = category.subCategories && category.subCategories.some(sub =>
          sub.name.toLowerCase().includes(searchLower) ||
          (sub.description?.toLowerCase().includes(searchLower) || false)
        );

        return matchesMain || matchesSubcategories;
      });
    }

    switch (this.sortBy) {
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'subcategories':
        filtered.sort((a, b) => (b.subCategories?.length || 0) - (a.subCategories?.length || 0));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredCategories = filtered;
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = 'all';
    this.sortBy = 'name';
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    this.cdr.markForCheck();
  }

  toggleCategoryExpansion(category: CategoryWithUI): void {
    const index = this.filteredCategories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      this.filteredCategories[index] = {
        ...this.filteredCategories[index],
        expanded: !this.filteredCategories[index].expanded
      };
      this.cdr.markForCheck();
    }
  }

  selectCategory(category: CategoryWithUI): void {
    this.router.navigate(['/published-posts'], {
      queryParams: { category: category.id }
    });
  }

  selectSubcategory(subcategory: Category): void {
    this.router.navigate(['/published-posts'], {
      queryParams: { category: subcategory.id }
    });
  }

  exploreCategory(category: CategoryWithUI): void {
    this.router.navigate(['/published-posts'], {
      queryParams: { category: category.id, title: category.name }
    });
  }

  exploreSubcategory(subcategory: Category): void {
    this.router.navigate(['/published-posts'], {
      queryParams: { category: subcategory.id, title: subcategory.name }
    });
  }

  createInCategory(category: CategoryWithUI): void {
    this.router.navigate(['/create-prediction'], {
      queryParams: { category: category.id }
    });
  }

  getCategoryGradient(category: CategoryWithUI): string {
    const primary = category.colorCode || '#6c757d';
    const secondary = this.darkenColor(primary, 20);
    return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  getTotalCategories(): number {
    return this.allCategories.length;
  }

  getTotalSubcategories(): number {
    return this.rootCategories.reduce((sum, category) =>
      sum + (category.subCategories?.length || 0), 0);
  }

  getRandomPredictionCount(isSubcategory = false): number {
    const base = isSubcategory ? 5 : 15;
    const variation = isSubcategory ? 20 : 50;
    return base + Math.floor(Math.random() * variation);
  }
}
