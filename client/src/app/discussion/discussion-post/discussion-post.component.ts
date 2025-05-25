// discussion/discussion-post/discussion-post.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  DiscussionService,
  DiscussionPost,
  Comment,
  AddComment
} from '../../_services/discussion.service';

@Component({
  selector: 'app-discussion-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './discussion-post.component.html',
  styleUrls: ['./discussion-post.component.css']
})
export class DiscussionPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private discussionService = inject(DiscussionService);

  discussionPost: DiscussionPost | null = null;
  commentForm: FormGroup = new FormGroup({});
  replyForm: FormGroup = new FormGroup({});

  isLoading = false;
  isSubmittingComment = false;
  isSubmittingReply: { [key: number]: boolean } = {};
  showReplyForm: { [key: number]: boolean } = {};
  expandedComments: { [key: number]: boolean } = {};
  isVoting = false;

  ngOnInit(): void {
    this.initializeForms();
    this.loadDiscussionPost();
  }

  initializeForms(): void {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]]
    });

    this.replyForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]]
    });
  }

  loadDiscussionPost(): void {
    const postId = this.route.snapshot.params['id'];
    if (!postId || isNaN(+postId)) {
      this.toastr.error('Invalid discussion post ID');
      this.router.navigate(['/discussions']);
      return;
    }

    this.isLoading = true;
    this.discussionService.getDiscussionPost(+postId).subscribe({
      next: (post: DiscussionPost) => {
        this.discussionPost = post;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading discussion post:', error);
        this.toastr.error('Failed to load discussion post');
        this.isLoading = false;
        this.router.navigate(['/discussions']);
      }
    });
  }

  submitComment(): void {
    if (!this.commentForm.valid || !this.discussionPost) {
      this.markFormGroupTouched(this.commentForm);
      return;
    }

    this.isSubmittingComment = true;

    const commentData: AddComment = {
      content: this.commentForm.get('content')?.value?.trim()
    };

    this.discussionService.addComment(this.discussionPost.id, commentData).subscribe({
      next: (comment: Comment) => {
        if (this.discussionPost) {
          this.discussionPost.comments.push(comment);
          this.discussionPost.commentsCount++;
        }
        this.commentForm.reset();
        this.isSubmittingComment = false;
        this.toastr.success('Comment added successfully');
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.toastr.error('Failed to add comment');
        this.isSubmittingComment = false;
      }
    });
  }

  submitReply(parentCommentId: number): void {
    if (!this.replyForm.valid || !this.discussionPost) {
      this.markFormGroupTouched(this.replyForm);
      return;
    }

    this.isSubmittingReply[parentCommentId] = true;

    const replyData: AddComment = {
      content: this.replyForm.get('content')?.value?.trim(),
      parentCommentId: parentCommentId
    };

    this.discussionService.addComment(this.discussionPost.id, replyData).subscribe({
      next: (reply: Comment) => {
        if (this.discussionPost) {
          // Find parent comment and add reply
          this.addReplyToComment(this.discussionPost.comments, parentCommentId, reply);
          this.discussionPost.commentsCount++;
        }
        this.replyForm.reset();
        this.hideReplyForm(parentCommentId);
        this.isSubmittingReply[parentCommentId] = false;
        this.toastr.success('Reply added successfully');
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        this.toastr.error('Failed to add reply');
        this.isSubmittingReply[parentCommentId] = false;
      }
    });
  }

  private addReplyToComment(comments: Comment[], parentId: number, reply: Comment): boolean {
    for (const comment of comments) {
      if (comment.id === parentId) {
        if (!comment.childComments) {
          comment.childComments = [];
        }
        comment.childComments.push(reply);
        comment.commentsCount = (comment.commentsCount || 0) + 1;
        return true;
      }
      if (comment.childComments && comment.childComments.length > 0) {
        if (this.addReplyToComment(comment.childComments, parentId, reply)) {
          return true;
        }
      }
    }
    return false;
  }

  deleteComment(commentId: number): void {
    if (!this.discussionPost) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.discussionService.deleteComment(commentId, this.discussionPost.id).subscribe({
        next: () => {
          if (this.discussionPost) {
            this.removeCommentFromList(this.discussionPost.comments, commentId);
            this.discussionPost.commentsCount = Math.max(0, this.discussionPost.commentsCount - 1);
          }
          this.toastr.success('Comment deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.toastr.error('Failed to delete comment');
        }
      });
    }
  }

  private removeCommentFromList(comments: Comment[], commentId: number): boolean {
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === commentId) {
        comments.splice(i, 1);
        return true;
      }
      if (comments[i].childComments && comments[i].childComments!.length > 0) {
        if (this.removeCommentFromList(comments[i].childComments!, commentId)) {
          comments[i].commentsCount = Math.max(0, (comments[i].commentsCount || 0) - 1);
          return true;
        }
      }
    }
    return false;
  }

  voteOnPost(voteType: 'up' | 'down'): void {
    if (!this.discussionPost || this.isVoting) return;

    this.isVoting = true;
    this.discussionService.voteOnPost(this.discussionPost.id, voteType).subscribe({
      next: (voteResponse) => {
        if (this.discussionPost) {
          this.discussionPost.upVotes = voteResponse.upVotes;
          this.discussionPost.downVotes = voteResponse.downVotes;
        }
        this.isVoting = false;
      },
      error: (error) => {
        console.error('Error voting on post:', error);
        this.toastr.error('Failed to vote on post');
        this.isVoting = false;
      }
    });
  }

  showReplyFormFor(commentId: number): void {
    this.showReplyForm[commentId] = true;
  }

  hideReplyForm(commentId: number): void {
    this.showReplyForm[commentId] = false;
    this.replyForm.reset();
    this.isSubmittingReply[commentId] = false;
  }

  toggleCommentExpansion(commentId: number): void {
    this.expandedComments[commentId] = !this.expandedComments[commentId];
  }

  isCommentExpanded(commentId: number): boolean {
    return this.expandedComments[commentId] || false;
  }

  isReplyFormVisible(commentId: number): boolean {
    return this.showReplyForm[commentId] || false;
  }

  isSubmittingReplyFor(commentId: number): boolean {
    return this.isSubmittingReply[commentId] || false;
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  canDeleteComment(comment: Comment): boolean {
    const currentUserId = this.getCurrentUserId();
    return (currentUserId !== null && comment.author?.id === currentUserId) || this.isAdmin();
  }

  canReplyToComment(): boolean {
    return this.isAuthenticated();
  }

  canEditPost(): boolean {
    if (!this.discussionPost) return false;
    const currentUserId = this.getCurrentUserId();
    return (currentUserId !== null && this.discussionPost.author?.id === currentUserId) || this.isAdmin();
  }

  canDeletePost(): boolean {
    return this.canEditPost(); // Same permissions as edit for now
  }

  private getCurrentUserId(): number | null {
    // TODO: Get current user ID from auth service
    return 1; // Mock user ID for now
  }

  private isAdmin(): boolean {
    // TODO: Check if current user is admin
    return false; // Mock for now
  }

  private isAuthenticated(): boolean {
    // TODO: Check if user is authenticated
    return true; // Mock for now
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // UI Helper methods
  getFormFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  hasFormFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Navigation and actions
  goBack(): void {
    this.router.navigate(['/discussions']);
  }

  editPost(): void {
    if (this.discussionPost) {
      this.router.navigate(['/discussions/edit', this.discussionPost.id]);
    }
  }

  deletePost(): void {
    if (!this.discussionPost) return;

    if (confirm('Are you sure you want to delete this discussion post? This action cannot be undone.')) {
      this.discussionService.deleteDiscussionPost(this.discussionPost.id).subscribe({
        next: () => {
          this.toastr.success('Discussion post deleted successfully');
          this.router.navigate(['/discussions']);
        },
        error: (error) => {
          console.error('Error deleting discussion post:', error);
          this.toastr.error('Failed to delete discussion post');
        }
      });
    }
  }

  sharePost(): void {
    if (this.discussionPost) {
      const url = window.location.href;
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

  // Helper for template
  hasReplies(comment: Comment): boolean {
    return !!(comment.childComments && comment.childComments.length > 0);
  }

  getReplyCount(comment: Comment): number {
    return comment.childComments?.length || 0;
  }

  // Tag navigation
  navigateToTag(tag: string): void {
    this.router.navigate(['/discussions/tag', tag]);
  }
}
