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
}

@Component({
  selector: 'app-published-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './published-posts.component.html',
  styleUrls: ['./published-posts.component.css']
})
export class PublishedPostsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);

  publishedPosts: PublishedPost[] = [];
  filteredPosts: PublishedPost[] = [];
  isLoading = false;
  showDebugInfo = false;
  debugRawData: any = null;

  // Category data
  rootCategories: Category[] = [];
  allSubcategories: { id: number, name: string, parentName: string }[] = [];

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedCategoryId: number | string = '';
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
    this.loadCategories();
    this.checkRouteParams();
    this.loadPublishedPosts();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategoryId = +params['category'];
        console.log('Setting category from route:', this.selectedCategoryId);
      }
      if (params['type']) {
        this.selectedType = params['type'];
      }
      if (params['search']) {
        this.searchTerm = params['search'];
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories();

    setTimeout(() => {
      this.rootCategories = this.categoryService.rootCategories();
      this.buildSubcategoriesList();
      console.log('Loaded categories:', this.rootCategories.length);
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

    console.log('Built subcategories list:', this.allSubcategories.length);
  }

  async loadPublishedPosts(): Promise<void> {
    this.isLoading = true;
    try {
      console.log('=== Loading Published Posts with Category Support ===');

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
      if (this.selectedCategoryId) {
        params.append('categoryId', this.selectedCategoryId.toString());
      }

      const apiUrl = `${environment.apiUrl}post/published?${params.toString()}`;
      console.log('Calling API:', apiUrl);

      const response = await this.http.get<PublishedPost[]>(apiUrl).toPromise();

      console.log('Raw API response:', response);
      this.debugRawData = response;

      if (response && Array.isArray(response)) {
        this.publishedPosts = response.map(post => {
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

          return processedPost;
        });

        console.log('Processed published posts:', this.publishedPosts);
        this.applyFiltersAndSorting();

        if (this.publishedPosts.length > 0) {
          this.toastr.success(`Loaded ${this.publishedPosts.length} published predictions`);
        } else {
          this.toastr.info('No published predictions found');
        }
      } else {
        this.publishedPosts = [];
        this.applyFiltersAndSorting();
        this.toastr.warning('No published predictions available');
      }

    } catch (error) {
      console.error('Error loading published posts:', error);
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

  filterByCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndSorting();

    const categoryName = this.getCategoryName(categoryId);
    this.toastr.info(`Filtering by category: ${categoryName}`);
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      console.log('Search term changed to:', this.searchTerm);
      this.currentPage = 1;
      this.updateUrlParams();
      this.applyFiltersAndSorting();
    }, 300);
  }

  onFilterChange(): void {
    console.log('Filter changed - Category:', this.selectedCategoryId, 'Type:', this.selectedType, 'Sort:', this.sortBy);
    this.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  clearFilters(): void {
    console.log('Clearing all filters');
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedCategoryId = '';
    this.sortBy = 'newest';
    this.currentPage = 1;
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId = '';
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  clearTypeFilter(): void {
    this.selectedType = '';
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  clearSortFilter(): void {
    this.sortBy = 'newest';
    this.updateUrlParams();
    this.applyFiltersAndSorting();
  }

  private updateUrlParams(): void {
    const queryParams: any = {};

    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedCategoryId) queryParams.category = this.selectedCategoryId;
    if (this.selectedType) queryParams.type = this.selectedType;
    if (this.sortBy && this.sortBy !== 'newest') queryParams.sort = this.sortBy;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  applyFiltersAndSorting(): void {
    console.log('=== Applying Filters and Sorting ===');
    console.log('Original posts count:', this.publishedPosts.length);
    console.log('Search term:', this.searchTerm);
    console.log('Selected category:', this.selectedCategoryId);
    console.log('Selected type:', this.selectedType);
    console.log('Sort by:', this.sortBy);

    let filtered = [...this.publishedPosts];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      console.log('Applying search filter for:', searchLower);

      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(searchLower);
        const descriptionMatch = post.description.toLowerCase().includes(searchLower);
        const authorMatch = post.author.displayName.toLowerCase().includes(searchLower);

        return titleMatch || descriptionMatch || authorMatch;
      });

      console.log('After search filter:', filtered.length, 'posts');
    }

    if (this.selectedCategoryId && this.selectedCategoryId !== '') {
      const categoryId = typeof this.selectedCategoryId === 'string' ?
        parseInt(this.selectedCategoryId) : this.selectedCategoryId;

      console.log('Applying category filter for ID:', categoryId);

      filtered = filtered.filter(post => {
        const categoryMatch = post.categories.some(cat => cat.id === categoryId);

        if (categoryMatch) {
          console.log(`Post "${post.title}" matches category filter`);
        }

        return categoryMatch;
      });

      console.log('After category filter:', filtered.length, 'posts');
    }

    if (this.selectedType && this.selectedType !== '' && this.selectedType !== 'All Types') {
      console.log('Applying type filter for:', this.selectedType);

      filtered = filtered.filter(post => {
        const typeMatch = post.predictionType === this.selectedType ||
                         post.predictionType.toString() === this.selectedType;

        return typeMatch;
      });

      console.log('After type filter:', filtered.length, 'posts');
    }

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
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    this.filteredPosts = filtered.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    );

    this.totalPosts = this.filteredPosts.length;
    this.totalPages = Math.ceil(this.totalPosts / this.pageSize);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    console.log('=== Filter Results ===');
    console.log('Filtered posts:', this.filteredPosts.length);
    console.log('Total pages:', this.totalPages);
    console.log('Current page:', this.currentPage);
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchTerm && this.searchTerm.trim() !== '') ||
      (this.selectedCategoryId && this.selectedCategoryId !== '') ||
      (this.selectedType && this.selectedType !== '' && this.selectedType !== 'All Types') ||
      (this.sortBy && this.sortBy !== 'newest')
    );
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
    return false;
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
