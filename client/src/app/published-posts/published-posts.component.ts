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
  templateUrl: './published-posts.component.html',
  styleUrls: ['./published-posts.component.css'],
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
  sortBy = 'mostResponses';

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

        if (this.allPosts.length == 0) {
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

  // FIXED: Icon mapping method
  getSafeIconClass(iconName: string | undefined): string {
    if (!iconName) return 'fa-tag';

    // Remove fa- prefix if it exists
    const cleanIconName = iconName.replace('fa-', '').toLowerCase().trim();

    if (!cleanIconName) return 'fa-tag';

    // Map broken/non-existent icons to working Font Awesome icons
    const safeIconMap: { [key: string]: string } = {
      // Sports icons
      'sports': 'fa-trophy',
      'sport': 'fa-trophy',
      'soccer': 'fa-futbol-o',
      'football': 'fa-shield',
      'american-football': 'fa-shield',
      'americanfootball': 'fa-shield',
      'nfl': 'fa-shield',
      'rugby': 'fa-shield',
      'gridiron': 'fa-shield',
      'basketball': 'fa-basketball-ball',
      'baseball': 'fa-baseball',
      'tennis': 'fa-trophy',
      'golf': 'fa-trophy',
      'hockey': 'fa-hockey-puck',
      'racing': 'fa-car',
      'olympics': 'fa-trophy',
      'championship': 'fa-trophy',
      'league': 'fa-trophy',
      'premier': 'fa-trophy',
      'competition': 'fa-trophy',

      // Entertainment icons
      'music': 'fa-music',
      'movies': 'fa-film',
      'tv': 'fa-tv',
      'entertainment': 'fa-film',
      'gaming': 'fa-gamepad',
      'esports': 'fa-gamepad',
      'game': 'fa-gamepad',
      'bingo': 'fa-th', // FIXED: fa-bingo doesn't exist, use fa-th
      'games': 'fa-gamepad',

      // Technology icons
      'technology': 'fa-laptop',
      'tech': 'fa-laptop',
      'software': 'fa-code',
      'mobile': 'fa-mobile',
      'computer': 'fa-laptop',

      // Business icons
      'business': 'fa-briefcase',
      'finance': 'fa-money',
      'economy': 'fa-line-chart',
      'stocks': 'fa-line-chart',

      // Education icons
      'education': 'fa-graduation-cap',
      'school': 'fa-graduation-cap',
      'university': 'fa-university',
      'science': 'fa-flask',
      'books': 'fa-book',

      // Travel and geography
      'travel': 'fa-plane',
      'tourism': 'fa-plane',
      'geography': 'fa-globe',
      'world': 'fa-globe',

      // Health and fitness
      'health': 'fa-heart',
      'medicine': 'fa-medkit',
      'fitness': 'fa-heart',

      // News and politics
      'news': 'fa-newspaper-o',
      'politics': 'fa-institution',
      'government': 'fa-institution',

      // Food and lifestyle
      'food': 'fa-cutlery',
      'cooking': 'fa-cutlery',
      'lifestyle': 'fa-home',
      'home': 'fa-home',

      // Default and fallback
      'default': 'fa-tag',
      'category': 'fa-tag',
      'tag': 'fa-tag',
      'tags': 'fa-tags'
    };

    // Direct mapping
    if (safeIconMap[cleanIconName]) {
      return safeIconMap[cleanIconName];
    }

    // Partial matching for compound names
    for (const [key, value] of Object.entries(safeIconMap)) {
      if (cleanIconName.includes(key) || key.includes(cleanIconName)) {
        return value;
      }
    }

    // List of known safe Font Awesome icons (v4.7)
    const knownSafeIcons = [
      'fa-trophy', 'fa-futbol-o', 'fa-basketball-ball', 'fa-baseball',
      'fa-music', 'fa-film', 'fa-tv', 'fa-gamepad', 'fa-laptop', 'fa-mobile',
      'fa-book', 'fa-graduation-cap', 'fa-university', 'fa-flask', 'fa-briefcase',
      'fa-money', 'fa-line-chart', 'fa-globe', 'fa-plane', 'fa-heart', 'fa-medkit',
      'fa-newspaper-o', 'fa-institution', 'fa-cutlery', 'fa-home', 'fa-users',
      'fa-tag', 'fa-tags', 'fa-star', 'fa-cog', 'fa-camera', 'fa-car',
      'fa-th', 'fa-list-ol', 'fa-sitemap', 'fa-check', 'fa-times', 'fa-plus',
      'fa-minus', 'fa-edit', 'fa-trash', 'fa-search', 'fa-filter', 'fa-sort'
    ];

    // Check if the original icon (with fa- prefix) is in our safe list
    const withPrefix = iconName.startsWith('fa-') ? iconName : `fa-${iconName}`;
    if (knownSafeIcons.includes(withPrefix)) {
      return withPrefix;
    }

    // Check cleaned version with prefix
    const cleanWithPrefix = `fa-${cleanIconName}`;
    if (knownSafeIcons.includes(cleanWithPrefix)) {
      return cleanWithPrefix;
    }

    // Fallback to tag icon
    return 'fa-tag';
  }

  // FIXED: Method to get full icon class with fa prefix
  getFullIconClass(iconName: string | undefined): string {
    const safeIcon = this.getSafeIconClass(iconName);
    // Don't double-add fa prefix
    return safeIcon.startsWith('fa ') ? safeIcon : `fa ${safeIcon}`;
  }

  // FIXED: Method to get predictionType icon
  getPredictionTypeIcon(predictionType: string): string {
    switch (predictionType) {
      case 'Ranking':
        return 'fa fa-list-ol';
      case 'Bracket':
        return 'fa fa-sitemap';
      case 'Bingo':
        return 'fa fa-th'; // FIXED: Use fa-th instead of non-existent icon
      default:
        return 'fa fa-question';
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
    this.sortBy = 'mostResponses';
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
