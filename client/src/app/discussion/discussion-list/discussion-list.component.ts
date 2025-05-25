// discussion/discussion-list/discussion-list.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  DiscussionService,
  DiscussionPost,
  CreateDiscussionPost,
  PaginationParams
} from '../../_services/discussion.service';
import { ToastrService } from 'ngx-toastr';

type SortOption = 'newest' | 'oldest' | 'most_commented' | 'most_voted';
type PrivacyType = 'Public' | 'Private';

@Component({
  selector: 'app-discussion-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './discussion-list.component.html',
  styleUrls: ['./discussion-list.component.css']
})
export class DiscussionListComponent implements OnInit {
  private discussionService = inject(DiscussionService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  // Data signals
  discussionPosts = signal<DiscussionPost[]>([]);
  filteredPosts = signal<DiscussionPost[]>([]);
  popularTags = signal<string[]>([]);

  // Forms
  createPostForm: FormGroup = new FormGroup({});
  searchForm: FormGroup = new FormGroup({});

  // UI State signals
  isLoading = signal<boolean>(false);
  showCreateForm = signal<boolean>(false);
  isCreatingPost = signal<boolean>(false);

  // Filter signals
  selectedTag = signal<string | null>(null);
  searchTerm = signal<string>('');
  sortBy = signal<SortOption>('newest');

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalPosts = signal<number>(0);

  ngOnInit(): void {
    this.initializeForms();
    this.loadDiscussionPosts();
    this.loadPopularTags();
  }

  initializeForms(): void {
    this.createPostForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      privacyType: ['Public' as PrivacyType, Validators.required],
      tags: ['']
    });

    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // Watch for search changes
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
      this.applyFilters();
    });
  }

  loadDiscussionPosts(): void {
    this.isLoading.set(true);

    const paginationParams: PaginationParams = {
      pageNumber: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.discussionService.getDiscussionPosts(paginationParams).subscribe({
      next: (posts: DiscussionPost[]) => {
        this.discussionPosts.set(posts);
        this.totalPosts.set(posts.length); // This should come from API response meta
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading discussion posts:', error);
        this.toastr.error('Failed to load discussion posts');
        this.isLoading.set(false);
      }
    });
  }

  loadPopularTags(): void {
    this.popularTags.set(this.discussionService.getPopularTags());
  }

  applyFilters(): void {
    let filtered = [...this.discussionPosts()];

    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(search);
        const descriptionMatch = post.description?.toLowerCase().includes(search) || false;
        const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(search));
        return titleMatch || descriptionMatch || tagMatch;
      });
    }

    // Apply tag filter
    const tag = this.selectedTag();
    if (tag) {
      filtered = filtered.filter(post => post.tags.includes(tag));
    }

    // Apply sorting
    const sort = this.sortBy();
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_commented':
          return b.commentsCount - a.commentsCount;
        case 'most_voted':
          return (b.upVotes - b.downVotes) - (a.upVotes - a.downVotes);
        default:
          return 0;
      }
    });

    this.filteredPosts.set(filtered);
  }

  createDiscussionPost(): void {
    if (!this.createPostForm.valid) {
      this.markFormGroupTouched(this.createPostForm);
      return;
    }

    this.isCreatingPost.set(true);

    const formValue = this.createPostForm.value;
    const postData: CreateDiscussionPost = {
      title: formValue.title?.trim(),
      description: formValue.description?.trim() || undefined,
      privacyType: formValue.privacyType as PrivacyType,
      tags: this.parseTags(formValue.tags)
    };

    // Validate tags
    const tagValidation = this.discussionService.validateTags(postData.tags);
    if (!tagValidation.valid) {
      tagValidation.errors.forEach(error => this.toastr.error(error));
      this.isCreatingPost.set(false);
      return;
    }

    this.discussionService.createDiscussionPost(postData).subscribe({
      next: (post: DiscussionPost) => {
        this.discussionPosts.update(posts => [post, ...posts]);
        this.applyFilters();
        this.resetCreateForm();
        this.showCreateForm.set(false);
        this.isCreatingPost.set(false);
        this.toastr.success('Discussion post created successfully!');
      },
      error: (error) => {
        console.error('Error creating post:', error);
        this.toastr.error('Failed to create discussion post');
        this.isCreatingPost.set(false);
      }
    });
  }

  private parseTags(tagString: string): string[] {
    if (!tagString) return [];

    return tagString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private resetCreateForm(): void {
    this.createPostForm.reset();
    this.createPostForm.patchValue({ privacyType: 'Public' });
  }

  // Filter methods
  selectTag(tag: string): void {
    const currentTag = this.selectedTag();
    this.selectedTag.set(currentTag === tag ? null : tag);
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedTag.set(null);
    this.searchTerm.set('');
    this.searchForm.get('searchTerm')?.setValue('');
    this.sortBy.set('newest');
    this.applyFilters();
  }

  changeSortOrder(sortBy: SortOption): void {
    this.sortBy.set(sortBy);
    this.applyFilters();
  }

  // Navigation
  viewPost(postId: number): void {
    this.router.navigate(['/discussions', postId]);
  }

  editPost(postId: number): void {
    this.router.navigate(['/discussions/edit', postId]);
  }

  // UI helpers
  toggleCreateForm(): void {
    this.showCreateForm.update(show => !show);
    if (!this.showCreateForm()) {
      this.resetCreateForm();
    }
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return this.formatDate(dateObj);
  }

  getPostExcerpt(description: string | undefined, maxLength: number = 150): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }

  getTagsDisplay(tags: string[], maxTags: number = 3): { displayed: string[], remaining: number } {
    return {
      displayed: tags.slice(0, maxTags),
      remaining: Math.max(0, tags.length - maxTags)
    };
  }

  // Form validation helpers
  getFormFieldError(fieldName: string): string {
    const field = this.createPostForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  hasFormFieldError(fieldName: string): boolean {
    const field = this.createPostForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'title': 'Title',
      'description': 'Description',
      'privacyType': 'Privacy Type',
      'tags': 'Tags'
    };
    return fieldNames[fieldName] || fieldName;
  }

  // Pagination methods
  nextPage(): void {
    if (this.canGoNext) {
      this.currentPage.update(page => page + 1);
      this.loadDiscussionPosts();
    }
  }

  previousPage(): void {
    if (this.canGoPrevious) {
      this.currentPage.update(page => Math.max(1, page - 1));
      this.loadDiscussionPosts();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      this.loadDiscussionPosts();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalPosts() / this.pageSize());
  }

  get canGoNext(): boolean {
    return this.currentPage() < this.totalPages;
  }

  get canGoPrevious(): boolean {
    return this.currentPage() > 1;
  }

  get paginationInfo(): string {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.totalPosts());
    return `Showing ${start}-${end} of ${this.totalPosts()} posts`;
  }

  getPaginationArray(): number[] {
    const maxPages = Math.min(this.totalPages, 10);
    const pages: number[] = [];
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Utility methods
  refreshPosts(): void {
    this.currentPage.set(1);
    this.loadDiscussionPosts();
  }

  canEditPost(post: DiscussionPost): boolean {
    // This should check against current user
    return this.discussionService.canUserEditPost(post, this.getCurrentUserId());
  }

  canDeletePost(post: DiscussionPost): boolean {
    // This should check against current user and admin status
    return this.discussionService.canUserDeletePost(post, this.getCurrentUserId(), this.isAdmin());
  }

  deletePost(postId: number): void {
    if (confirm('Are you sure you want to delete this discussion post?')) {
      this.discussionService.deleteDiscussionPost(postId).subscribe({
        next: () => {
          this.discussionPosts.update(posts => posts.filter(post => post.id !== postId));
          this.applyFilters();
          this.toastr.success('Discussion post deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          this.toastr.error('Failed to delete discussion post');
        }
      });
    }
  }

  private getCurrentUserId(): number {
    // TODO: Get from auth service
    return 1; // Mock for now
  }

  private isAdmin(): boolean {
    // TODO: Get from auth service
    return false; // Mock for now
  }

  // Search and filter helpers
  clearSearch(): void {
    this.searchForm.get('searchTerm')?.setValue('');
    this.searchTerm.set('');
    this.applyFilters();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTag() === tag;
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedTag() || this.searchTerm() || this.sortBy() !== 'newest');
  }

  // Share functionality
  sharePost(post: DiscussionPost): void {
    const url = `${window.location.origin}/discussions/${post.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        this.toastr.success('Post URL copied to clipboard');
      }).catch(() => {
        this.fallbackCopyTextToClipboard(url);
      });
    } else {
      this.fallbackCopyTextToClipboard(url);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.toastr.success('Post URL copied to clipboard');
      } else {
        this.toastr.error('Failed to copy URL');
      }
    } catch (err) {
      this.toastr.error('Failed to copy URL');
    }

    document.body.removeChild(textArea);
  }

  // Template helper methods for complex calculations
  getTotalComments(): number {
    return this.discussionPosts().reduce((sum, post) => sum + post.commentsCount, 0);
  }

  getTotalVotes(): number {
    return this.discussionPosts().reduce((sum, post) => sum + post.upVotes + post.downVotes, 0);
  }

  getMostActiveTag(): string {
    const tagCounts: { [key: string]: number } = {};
    this.discussionPosts().forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    let mostActiveTag = '';
    let maxCount = 0;
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveTag = tag;
      }
    });

    return mostActiveTag || 'general';
  }

  // TrackBy function for better performance
  trackByPostId(index: number, post: DiscussionPost): number {
    return post.id;
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  // Event handlers
  onCardHover(event: Event, isHovering: boolean): void {
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList) {
      if (isHovering) {
        target.classList.add('shadow');
      } else {
        target.classList.remove('shadow');
      }
    }
  }
}
