// _services/discussion.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export interface DiscussionPost {
  id: number;
  title: string;
  description?: string;
  privacyType: 'Public' | 'Private';
  createdAt: Date;
  lastModified: Date;
  isDraft: boolean;
  accessCode?: string;
  tags: string[];
  comments: Comment[];
  author?: any;
  commentsCount: number;
  upVotes: number;
  downVotes: number;
}

export interface Comment {
  id: number;
  content: string;
  author?: any;
  createdAt: Date;
  childComments?: Comment[];
  commentsCount: number;
}

export interface CreateDiscussionPost {
  title: string;
  description?: string;
  privacyType: 'Public' | 'Private';
  tags: string[];
}

export interface UpdateDiscussionPost {
  id: number;
  title: string;
  description?: string;
  privacyType: 'Public' | 'Private';
  tags: string[];
}

export interface AddComment {
  content: string;
  parentCommentId?: number;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface VoteResponse {
  upVotes: number;
  downVotes: number;
  userVote?: 'up' | 'down' | null;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private baseUrl = environment.apiUrl + 'discussion';

  // Cache for discussion posts
  discussionPosts = signal<DiscussionPost[]>([]);
  currentPost = signal<DiscussionPost | null>(null);
  popularTags = signal<string[]>([]);
  isLoading = signal<boolean>(false);

  constructor() {
    this.loadPopularTags();
  }

  // Create a new discussion post
  createDiscussionPost(postData: CreateDiscussionPost): Observable<DiscussionPost> {
    return this.http.post<any>(`${this.baseUrl}/create`, postData).pipe(
      map(rawPost => {
        const post = this.formatDiscussionPost(rawPost);
        // Add to local cache
        this.discussionPosts.update(posts => [post, ...posts]);
        this.toastr.success('Discussion post created successfully');
        return post;
      }),
      catchError(error => {
        console.error('Error creating discussion post:', error);
        this.toastr.error('Failed to create discussion post');
        return throwError(() => error);
      })
    );
  }

  // Get a single discussion post by ID
  getDiscussionPost(id: number): Observable<DiscussionPost> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(rawPost => {
        const post = this.formatDiscussionPost(rawPost);
        this.currentPost.set(post);
        return post;
      }),
      catchError(error => {
        console.error('Error fetching discussion post:', error);
        this.toastr.error('Failed to load discussion post');
        return throwError(() => error);
      })
    );
  }

  // Get all discussion posts with optional pagination
  getDiscussionPosts(paginationParams?: PaginationParams): Observable<DiscussionPost[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (paginationParams) {
      params = params.append('pageNumber', paginationParams.pageNumber.toString());
      params = params.append('pageSize', paginationParams.pageSize.toString());
    }

    return this.http.get<any[]>(this.baseUrl, { params }).pipe(
      map(rawPosts => {
        const posts = rawPosts.map(rawPost => this.formatDiscussionPost(rawPost));
        this.discussionPosts.set(posts);
        this.isLoading.set(false);
        return posts;
      }),
      catchError(error => {
        console.error('Error fetching discussion posts:', error);
        this.toastr.error('Failed to load discussion posts');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  // Get discussion posts by specific user
  getUserDiscussionPosts(userId: number, paginationParams?: PaginationParams): Observable<DiscussionPost[]> {
    let params = new HttpParams();
    if (paginationParams) {
      params = params.append('pageNumber', paginationParams.pageNumber.toString());
      params = params.append('pageSize', paginationParams.pageSize.toString());
    }

    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`, { params }).pipe(
      map(rawPosts => rawPosts.map(rawPost => this.formatDiscussionPost(rawPost))),
      catchError(error => {
        console.error('Error fetching user discussion posts:', error);
        this.toastr.error('Failed to load user discussion posts');
        return throwError(() => error);
      })
    );
  }

  // Get current user's discussion posts
  getMyDiscussionPosts(paginationParams?: PaginationParams): Observable<DiscussionPost[]> {
    let params = new HttpParams();
    if (paginationParams) {
      params = params.append('pageNumber', paginationParams.pageNumber.toString());
      params = params.append('pageSize', paginationParams.pageSize.toString());
    }

    return this.http.get<any[]>(`${this.baseUrl}/my-posts`, { params }).pipe(
      map(rawPosts => rawPosts.map(rawPost => this.formatDiscussionPost(rawPost))),
      catchError(error => {
        console.error('Error fetching my discussion posts:', error);
        this.toastr.error('Failed to load your discussion posts');
        return throwError(() => error);
      })
    );
  }

  // Update an existing discussion post
  updateDiscussionPost(postData: UpdateDiscussionPost): Observable<DiscussionPost> {
    return this.http.put<any>(`${this.baseUrl}/update`, postData).pipe(
      map(rawPost => {
        const updatedPost = this.formatDiscussionPost(rawPost);

        // Update local cache
        this.discussionPosts.update(posts =>
          posts.map(post =>
            post.id === postData.id ? updatedPost : post
          )
        );

        // Update current post if it's the same
        const currentPost = this.currentPost();
        if (currentPost && currentPost.id === postData.id) {
          this.currentPost.set(updatedPost);
        }

        this.toastr.success('Discussion post updated successfully');
        return updatedPost;
      }),
      catchError(error => {
        console.error('Error updating discussion post:', error);
        this.toastr.error('Failed to update discussion post');
        return throwError(() => error);
      })
    );
  }

  // Delete a discussion post
  deleteDiscussionPost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(() => {
        // Remove from local cache
        this.discussionPosts.update(posts => posts.filter(post => post.id !== id));

        // Clear current post if it's the deleted one
        const currentPost = this.currentPost();
        if (currentPost && currentPost.id === id) {
          this.currentPost.set(null);
        }

        this.toastr.success('Discussion post deleted successfully');
      }),
      catchError(error => {
        console.error('Error deleting discussion post:', error);
        this.toastr.error('Failed to delete discussion post');
        return throwError(() => error);
      })
    );
  }

  // Add a comment to a discussion post
  addComment(postId: number, commentData: AddComment): Observable<Comment> {
    return this.http.post<any>(`${this.baseUrl}/${postId}/comment`, commentData).pipe(
      map(rawComment => {
        const comment = this.formatComment(rawComment);

        // Update local cache - increment comment count
        this.discussionPosts.update(posts =>
          posts.map(post =>
            post.id === postId
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          )
        );

        // Update current post if it's the same
        const currentPost = this.currentPost();
        if (currentPost && currentPost.id === postId) {
          this.currentPost.update(post => post ? {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, comment]
          } : null);
        }

        this.toastr.success('Comment added successfully');
        return comment;
      }),
      catchError(error => {
        console.error('Error adding comment:', error);
        this.toastr.error('Failed to add comment');
        return throwError(() => error);
      })
    );
  }

  // Delete a comment
  deleteComment(commentId: number, postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comment/${commentId}`).pipe(
      map(() => {
        // Update local cache - decrement comment count
        this.discussionPosts.update(posts =>
          posts.map(post =>
            post.id === postId
              ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
              : post
          )
        );

        // Update current post if it's the same
        const currentPost = this.currentPost();
        if (currentPost && currentPost.id === postId) {
          this.currentPost.update(post => post ? {
            ...post,
            commentsCount: Math.max(0, post.commentsCount - 1),
            comments: post.comments.filter(comment => comment.id !== commentId)
          } : null);
        }

        this.toastr.success('Comment deleted successfully');
      }),
      catchError(error => {
        console.error('Error deleting comment:', error);
        this.toastr.error('Failed to delete comment');
        return throwError(() => error);
      })
    );
  }

  // Search discussion posts
  searchDiscussionPosts(searchTerm: string, paginationParams?: PaginationParams): Observable<DiscussionPost[]> {
    let params = new HttpParams();
    params = params.append('searchTerm', searchTerm);

    if (paginationParams) {
      params = params.append('pageNumber', paginationParams.pageNumber.toString());
      params = params.append('pageSize', paginationParams.pageSize.toString());
    }

    return this.http.get<any[]>(`${this.baseUrl}/search`, { params }).pipe(
      map(rawPosts => rawPosts.map(rawPost => this.formatDiscussionPost(rawPost))),
      catchError(error => {
        console.error('Error searching discussion posts:', error);
        this.toastr.error('Failed to search discussion posts');
        return throwError(() => error);
      })
    );
  }

  // Get discussion posts by tag
  getDiscussionPostsByTag(tag: string, paginationParams?: PaginationParams): Observable<DiscussionPost[]> {
    let params = new HttpParams();
    if (paginationParams) {
      params = params.append('pageNumber', paginationParams.pageNumber.toString());
      params = params.append('pageSize', paginationParams.pageSize.toString());
    }

    return this.http.get<any[]>(`${this.baseUrl}/tag/${tag}`, { params }).pipe(
      map(rawPosts => rawPosts.map(rawPost => this.formatDiscussionPost(rawPost))),
      catchError(error => {
        console.error('Error fetching posts by tag:', error);
        this.toastr.error('Failed to load posts for this tag');
        return throwError(() => error);
      })
    );
  }

  // Vote on discussion post
  voteOnPost(postId: number, voteType: 'up' | 'down'): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.baseUrl}/${postId}/vote`, { voteType }).pipe(
      map(response => {
        // Update local cache with new vote counts
        this.discussionPosts.update(posts =>
          posts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  upVotes: response.upVotes,
                  downVotes: response.downVotes
                }
              : post
          )
        );

        // Update current post if it's the same
        const currentPost = this.currentPost();
        if (currentPost && currentPost.id === postId) {
          this.currentPost.update(post => post ? {
            ...post,
            upVotes: response.upVotes,
            downVotes: response.downVotes
          } : null);
        }

        return response;
      }),
      catchError(error => {
        console.error('Error voting on post:', error);
        this.toastr.error('Failed to vote on post');
        return throwError(() => error);
      })
    );
  }

  // Get popular tags
  getPopularTags(): string[] {
    return this.popularTags();
  }

  // Utility methods for discussion posts
  formatDiscussionPost(rawPost: any): DiscussionPost {
    return {
      ...rawPost,
      createdAt: new Date(rawPost.createdAt),
      lastModified: new Date(rawPost.lastModified),
      comments: rawPost.comments?.map((comment: any) => this.formatComment(comment)) || [],
      tags: rawPost.tags || [],
      commentsCount: rawPost.commentsCount || 0,
      upVotes: rawPost.upVotes || 0,
      downVotes: rawPost.downVotes || 0
    };
  }

  formatComment(rawComment: any): Comment {
    return {
      ...rawComment,
      createdAt: new Date(rawComment.createdAt),
      childComments: rawComment.childComments?.map((child: any) => this.formatComment(child)) || [],
      commentsCount: rawComment.commentsCount || 0
    };
  }

  // Permission checking helper methods
  canUserEditPost(post: DiscussionPost, currentUserId: number): boolean {
    return post.author?.id === currentUserId;
  }

  canUserDeletePost(post: DiscussionPost, currentUserId: number, isAdmin: boolean = false): boolean {
    return post.author?.id === currentUserId || isAdmin;
  }

  canUserDeleteComment(comment: Comment, currentUserId: number, isAdmin: boolean = false): boolean {
    return comment.author?.id === currentUserId || isAdmin;
  }

  // Tag validation
  validateTags(tags: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    // Remove duplicates
    const uniqueTags = [...new Set(tags)];
    if (uniqueTags.length !== tags.length) {
      errors.push('Duplicate tags are not allowed');
    }

    uniqueTags.forEach(tag => {
      if (tag.length < 2) {
        errors.push(`Tag "${tag}" is too short (minimum 2 characters)`);
      }
      if (tag.length > 20) {
        errors.push(`Tag "${tag}" is too long (maximum 20 characters)`);
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(tag)) {
        errors.push(`Tag "${tag}" contains invalid characters (only letters, numbers, hyphens, and underscores allowed)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Cache management
  clearCache(): void {
    this.discussionPosts.set([]);
    this.currentPost.set(null);
  }

  refreshCache(): void {
    this.getDiscussionPosts().subscribe();
  }

  // Load popular tags (private method)
  private loadPopularTags(): void {
    // This would typically come from a dedicated endpoint
    // For now, we'll use mock data
    this.popularTags.set([
      'sports', 'entertainment', 'politics', 'technology',
      'gaming', 'music', 'movies', 'finance', 'general',
      'education', 'health', 'travel', 'food', 'science'
    ]);

    // Optionally load from API:
    // this.http.get<string[]>(`${this.baseUrl}/popular-tags`).subscribe({
    //   next: tags => this.popularTags.set(tags),
    //   error: () => console.warn('Failed to load popular tags, using defaults')
    // });
  }

  // Bulk operations
  deleteMultiplePosts(postIds: number[]): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bulk-delete`, {
      body: { postIds }
    }).pipe(
      map(() => {
        // Remove all deleted posts from cache
        this.discussionPosts.update(posts =>
          posts.filter(post => !postIds.includes(post.id))
        );
        this.toastr.success(`${postIds.length} posts deleted successfully`);
      }),
      catchError(error => {
        console.error('Error deleting posts:', error);
        this.toastr.error('Failed to delete posts');
        return throwError(() => error);
      })
    );
  }

  // Get trending posts
  getTrendingPosts(timeframe: 'day' | 'week' | 'month' = 'week'): Observable<DiscussionPost[]> {
    const params = new HttpParams().append('timeframe', timeframe);

    return this.http.get<any[]>(`${this.baseUrl}/trending`, { params }).pipe(
      map(rawPosts => rawPosts.map(rawPost => this.formatDiscussionPost(rawPost))),
      catchError(error => {
        console.error('Error fetching trending posts:', error);
        this.toastr.error('Failed to load trending posts');
        return throwError(() => error);
      })
    );
  }
}
