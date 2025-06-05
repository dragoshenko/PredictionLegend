// _services/search-pagination.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PredictionSearchParams {
  searchTerm?: string;
  categoryIds?: number[];
  predictionType?: string;
  privacyType?: string;
  sortBy?: string;
  sortDescending?: boolean;
  isActive?: boolean;
  isDraft?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  userId?: number;
}

export interface DiscussionSearchParams {
  searchTerm?: string;
  tag?: string;
  sortBy?: string;
  sortDescending?: boolean;
  privacyType?: string;
  userId?: number;
}

export interface TeamSearchParams {
  searchTerm?: string;
  userId?: number;
  templateId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchPaginationService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private baseUrl = environment.apiUrl + 'search';

  // Search state
  currentSearchParams = signal<any>({});
  currentPaginationParams = signal<PaginationParams>({ pageNumber: 1, pageSize: 10 });
  isSearching = signal<boolean>(false);

  constructor() {}

  // Prediction search
  searchPredictions(
    searchParams: PredictionSearchParams,
    paginationParams: PaginationParams
  ): Observable<PaginatedResponse<any>> {
    let params = this.buildHttpParams(paginationParams);

    // Add search parameters
    if (searchParams.searchTerm) {
      params = params.append('searchTerm', searchParams.searchTerm);
    }
    if (searchParams.categoryIds && searchParams.categoryIds.length > 0) {
      searchParams.categoryIds.forEach(id => {
        params = params.append('categoryIds', id.toString());
      });
    }
    if (searchParams.predictionType) {
      params = params.append('predictionType', searchParams.predictionType);
    }
    if (searchParams.privacyType) {
      params = params.append('privacyType', searchParams.privacyType);
    }
    if (searchParams.sortBy) {
      params = params.append('sortBy', searchParams.sortBy);
    }
    if (searchParams.sortDescending !== undefined) {
      params = params.append('sortDescending', searchParams.sortDescending.toString());
    }
    if (searchParams.isActive !== undefined) {
      params = params.append('isActive', searchParams.isActive.toString());
    }
    if (searchParams.isDraft !== undefined) {
      params = params.append('isDraft', searchParams.isDraft.toString());
    }
    if (searchParams.createdAfter) {
      params = params.append('createdAfter', searchParams.createdAfter.toISOString());
    }
    if (searchParams.createdBefore) {
      params = params.append('createdBefore', searchParams.createdBefore.toISOString());
    }
    if (searchParams.userId) {
      params = params.append('userId', searchParams.userId.toString());
    }

    this.isSearching.set(true);
    this.currentSearchParams.set(searchParams);
    this.currentPaginationParams.set(paginationParams);

    return this.http.post<PaginatedResponse<any>>(`${this.baseUrl}/predictions`, {}, { params }).pipe(
      catchError(error => {
        console.error('Error searching predictions:', error);
        this.toastr.error('Failed to search predictions');
        this.isSearching.set(false);
        return throwError(() => error);
      })
    );
  }

  // Discussion posts search
  searchDiscussionPosts(
    searchParams: DiscussionSearchParams,
    paginationParams: PaginationParams
  ): Observable<PaginatedResponse<any>> {
    let params = this.buildHttpParams(paginationParams);

    if (searchParams.searchTerm) {
      params = params.append('searchTerm', searchParams.searchTerm);
    }
    if (searchParams.tag) {
      params = params.append('tag', searchParams.tag);
    }
    if (searchParams.sortBy) {
      params = params.append('sortBy', searchParams.sortBy);
    }
    if (searchParams.sortDescending !== undefined) {
      params = params.append('sortDescending', searchParams.sortDescending.toString());
    }
    if (searchParams.privacyType) {
      params = params.append('privacyType', searchParams.privacyType);
    }
    if (searchParams.userId) {
      params = params.append('userId', searchParams.userId.toString());
    }

    this.isSearching.set(true);

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/discussion-posts`, { params }).pipe(
      catchError(error => {
        console.error('Error searching discussion posts:', error);
        this.toastr.error('Failed to search discussion posts');
        this.isSearching.set(false);
        return throwError(() => error);
      })
    );
  }

  // Teams search
  searchTeams(
    searchParams: TeamSearchParams,
    paginationParams: PaginationParams
  ): Observable<PaginatedResponse<any>> {
    let params = this.buildHttpParams(paginationParams);

    if (searchParams.searchTerm) {
      params = params.append('searchTerm', searchParams.searchTerm);
    }
    if (searchParams.userId) {
      params = params.append('userId', searchParams.userId.toString());
    }
    if (searchParams.templateId) {
      params = params.append('templateId', searchParams.templateId.toString());
    }

    this.isSearching.set(true);

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/teams`, { params }).pipe(
      catchError(error => {
        console.error('Error searching teams:', error);
        this.toastr.error('Failed to search teams');
        this.isSearching.set(false);
        return throwError(() => error);
      })
    );
  }

  // Get popular tags for discussions
  getPopularTags(count: number = 10): Observable<string[]> {
    let params = new HttpParams().append('count', count.toString());

    return this.http.get<string[]>(`${this.baseUrl}/popular-tags`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching popular tags:', error);
        return throwError(() => error);
      })
    );
  }

  // Get popular categories
  getPopularCategories(count: number = 10): Observable<any[]> {
    let params = new HttpParams().append('count', count.toString());

    return this.http.get<any[]>(`${this.baseUrl}/popular-categories`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching popular categories:', error);
        return throwError(() => error);
      })
    );
  }

  // Helper methods
  private buildHttpParams(paginationParams: PaginationParams): HttpParams {
    return new HttpParams()
      .append('pageNumber', paginationParams.pageNumber.toString())
      .append('pageSize', paginationParams.pageSize.toString());
  }

  // Pagination helpers
  getNextPage(): PaginationParams {
    const current = this.currentPaginationParams();
    return {
      ...current,
      pageNumber: current.pageNumber + 1
    };
  }

  getPreviousPage(): PaginationParams {
    const current = this.currentPaginationParams();
    return {
      ...current,
      pageNumber: Math.max(1, current.pageNumber - 1)
    };
  }

  goToPage(pageNumber: number): PaginationParams {
    return {
      ...this.currentPaginationParams(),
      pageNumber: Math.max(1, pageNumber)
    };
  }

  changePageSize(pageSize: number): PaginationParams {
    return {
      pageNumber: 1, // Reset to first page when changing page size
      pageSize: pageSize
    };
  }

  // Search state management
  clearSearch(): void {
    this.currentSearchParams.set({});
    this.currentPaginationParams.set({ pageNumber: 1, pageSize: 10 });
    this.isSearching.set(false);
  }

  hasActiveSearch(): boolean {
    const params = this.currentSearchParams();
    return Object.keys(params).length > 0 &&
           Object.values(params).some(value =>
             value !== undefined && value !== null && value !== ''
           );
  }

  // URL state management for bookmarkable searches
  buildSearchUrl(baseUrl: string, searchParams: any, paginationParams: PaginationParams): string {
    const url = new URL(baseUrl, window.location.origin);

    // Add pagination params
    url.searchParams.set('page', paginationParams.pageNumber.toString());
    url.searchParams.set('size', paginationParams.pageSize.toString());

    // Add search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v.toString()));
        } else {
          url.searchParams.set(key, value.toString());
        }
      }
    });

    return url.toString();
  }

  parseSearchUrl(urlParams: URLSearchParams): { searchParams: any, paginationParams: PaginationParams } {
    const paginationParams: PaginationParams = {
      pageNumber: parseInt(urlParams.get('page') || '1'),
      pageSize: parseInt(urlParams.get('size') || '10')
    };

    const searchParams: any = {};

    // Parse common search parameters
    const searchTerm = urlParams.get('searchTerm');
    if (searchTerm) searchParams.searchTerm = searchTerm;

    const sortBy = urlParams.get('sortBy');
    if (sortBy) searchParams.sortBy = sortBy;

    const sortDescending = urlParams.get('sortDescending');
    if (sortDescending) searchParams.sortDescending = sortDescending === 'true';

    // Parse array parameters
    const categoryIds = urlParams.getAll('categoryIds');
    if (categoryIds.length > 0) {
      searchParams.categoryIds = categoryIds.map(id => parseInt(id));
    }

    return { searchParams, paginationParams };
  }

  // Reset search state
  resetSearchState(): void {
    this.clearSearch();
  }

  // Search completion callback
  onSearchComplete(): void {
    this.isSearching.set(false);
  }
}
