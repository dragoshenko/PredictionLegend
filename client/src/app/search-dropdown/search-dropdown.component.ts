// Create these files in your Angular project:

// 1. client/src/app/search-dropdown/search-dropdown.component.ts
import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

interface SearchResult {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  author: {
    displayName: string;
    photoUrl?: string;
  };
  categories: Array<{
    name: string;
    colorCode?: string;
  }>;
  createdAt: Date;
  isActive: boolean;
  isDraft: boolean;
}

@Component({
  selector: 'app-search-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-dropdown.component.html',
  styleUrls: ['./search-dropdown.component.css']
})
export class SearchDropdownComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private http = inject(HttpClient);
  private elementRef = inject(ElementRef);

  searchTerm = '';
  searchResults: SearchResult[] = [];
  showDropdown = false;
  isSearching = false;
  noResults = false;
  selectedIndex = -1;
  maxResults = 8;

  private searchSubject = new Subject<string>();
  private searchTimeout: any;

  trackByResultId = (index: number, result: SearchResult): number => result.id;

  ngOnInit(): void {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchPredictions(term))
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
        this.noResults = results.length === 0 && this.searchTerm.trim().length > 0;
        this.selectedIndex = -1;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchResults = [];
        this.isSearching = false;
        this.noResults = true;
        this.selectedIndex = -1;
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;

    if (this.searchTerm.trim().length >= 2) {
      this.isSearching = true;
      this.showDropdown = true;
      this.searchSubject.next(this.searchTerm.trim());
    } else {
      this.searchResults = [];
      this.showDropdown = false;
      this.isSearching = false;
      this.noResults = false;
    }
  }

  onFocus(): void {
    if (this.searchTerm.trim().length >= 2) {
      this.showDropdown = true;
    }
  }

  onBlur(): void {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      this.showDropdown = false;
      this.selectedIndex = -1;
    }, 150);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showDropdown || this.searchResults.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
          this.selectResult(this.searchResults[this.selectedIndex]);
        } else {
          this.performSearch();
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.selectedIndex = -1;
        this.searchInput.nativeElement.blur();
        break;
    }
  }

  private searchPredictions(term: string) {
    if (!term || term.length < 2) {
      return of([]);
    }

    const params = new URLSearchParams({
      searchTerm: term,
      pageSize: this.maxResults.toString(),
      pageNumber: '1'
    });

    return this.http.get<SearchResult[]>(
      `${environment.apiUrl}post/published?${params.toString()}`
    ).pipe(
      catchError(error => {
        console.error('Search API error:', error);
        return of([]);
      })
    );
  }

  selectResult(result: SearchResult): void {
    console.log('Selected prediction:', result);
    this.showDropdown = false;
    this.searchTerm = '';
    this.selectedIndex = -1;

    // Navigate to prediction details
    this.router.navigate(['/prediction-details', result.id]);
  }

  performSearch(): void {
    if (!this.searchTerm.trim()) {
      return;
    }

    console.log('Performing full search for:', this.searchTerm);
    this.showDropdown = false;

    // Navigate to published posts with search query
    this.router.navigate(['/published-posts'], {
      queryParams: { search: this.searchTerm.trim() }
    });
  }

  viewAllResults(): void {
    this.performSearch();
  }

  highlightMatch(text: string): string {
    if (!this.searchTerm.trim() || !text) {
      return text;
    }

    const searchRegex = new RegExp(`(${this.escapeRegExp(this.searchTerm.trim())})`, 'gi');
    return text.replace(searchRegex, '<span class="highlighted-text">$1</span>');
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      this.selectedIndex = -1;
    }
  }
}
