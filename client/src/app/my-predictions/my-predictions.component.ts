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
  templateUrl: './my-predictions.component.html',
  styleUrls: ['./my-predictions.component.css'],
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
  sortBy = 'mostResponses';

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

  // FIXED: Icon mapping methods (same as published-posts)
  getSafeIconClass(iconName: string | undefined): string {
    if (!iconName) return 'fa-tag';

    const cleanIconName = iconName.replace('fa-', '').toLowerCase().trim();

    if (!cleanIconName) return 'fa-tag';

    // Map broken/non-existent icons to working Font Awesome icons
    const safeIconMap: { [key: string]: string } = {
      // Sports icons
      'sports': 'fa-trophy',
      'sport': 'fa-trophy',
      'soccer': 'fa-futbol-o', // Soccer/Association Football (round ball)
      'football': 'fa-futbol-o', // Football (European/World) - same as soccer
      'american-football': 'fa-shield', // American Football - shield represents teams/protection
      'americanfootball': 'fa-shield', // Alternative spelling
      'nfl': 'fa-shield', // NFL/American Football
      'rugby': 'fa-shield', // Similar to American football
      'gridiron': 'fa-shield', // Another name for American football
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
      'fa-minus', 'fa-edit', 'fa-trash', 'fa-search', 'fa-filter', 'fa-sort',
      'fa-shield'
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
    this.sortBy = 'mostResponses';
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
