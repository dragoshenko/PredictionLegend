// post-view/post-view.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

interface PostView {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  isDraft: boolean;
  isActive: boolean;
  author: any;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
  categories?: any[];
}

@Component({
  selector: 'app-post-view',
  imports: [CommonModule],
  template: `
    <div class="container-fluid mt-4" *ngIf="post">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">{{ post.title }}</h2>
              <p class="text-light mb-0 opacity-75">{{ post.description }}</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light" (click)="goBack()">
                <i class="fa fa-arrow-left me-2"></i>Back
              </button>
              <button *ngIf="post.isDraft" class="btn btn-warning" (click)="editPost()">
                <i class="fa fa-edit me-2"></i>Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Info -->
      <div class="row mb-4">
        <div class="col-md-8">
          <!-- Ranking Display -->
          <div *ngIf="post.predictionType === 'Ranking' && post.postRank" class="card bg-secondary border-secondary">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-list-ol me-2"></i>Ranking Prediction
              </h4>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th width="80">Rank</th>
                      <th *ngFor="let col of post.postRank.rankTable.rows[0]?.columns || []; let i = index">
                        Position {{ i + 1 }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of post.postRank.rankTable.rows || []; let rowIndex = index">
                      <td class="fw-bold">#{{ row.order }}</td>
                      <td *ngFor="let column of row.columns || []">
                        <div *ngIf="column.team" class="d-flex align-items-center">
                          <img *ngIf="column.team.photoUrl" [src]="column.team.photoUrl"
                               class="rounded me-2" width="32" height="32" alt="Team">
                          <div>
                            <div class="fw-bold text-light">{{ column.team.name }}</div>
                            <div class="small text-muted">{{ column.team.description || 'No description' }}</div>
                          </div>
                        </div>
                        <div *ngIf="!column.team" class="text-muted">Empty</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Bingo Display -->
          <div *ngIf="post.predictionType === 'Bingo' && post.postBingo" class="card bg-secondary border-secondary">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-th me-2"></i>Bingo Prediction
              </h4>
            </div>
            <div class="card-body">
              <div class="bingo-grid"
                   [style.grid-template-columns]="'repeat(' + post.postBingo.gridSize + ', 1fr)'"
                   [style.gap]="'8px'"
                   [style.display]="'grid'">

                <div *ngFor="let cell of post.postBingo.bingoCells || []"
                     class="bingo-cell p-2 border border-secondary text-center"
                     [style.aspect-ratio]="'1'"
                     [style.background-color]="cell.team ? '#28a745' : '#6c757d'">

                  <div *ngIf="cell.team">
                    <img *ngIf="cell.team.photoUrl" [src]="cell.team.photoUrl"
                         class="rounded mb-1" width="24" height="24" alt="Team">
                    <div class="small text-light">{{ cell.team.name }}</div>
                  </div>
                  <div *ngIf="!cell.team" class="text-muted small">Empty</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bracket Display -->
          <div *ngIf="post.predictionType === 'Bracket' && post.postBracket" class="card bg-secondary border-secondary">
            <div class="card-header bg-secondary border-secondary">
              <h4 class="text-light mb-0">
                <i class="fa fa-sitemap me-2"></i>Bracket Prediction
              </h4>
            </div>
            <div class="card-body">
              <p class="text-light">Bracket visualization coming soon...</p>
              <pre class="text-light small">{{ post.postBracket | json }}</pre>
            </div>
          </div>

          <!-- No Post Data -->
          <div *ngIf="!hasPostData()" class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>No Prediction Data</h5>
              <p class="mb-0">This prediction doesn't have any ranking, bracket, or bingo data yet.</p>
              <button *ngIf="post.isDraft" class="btn btn-primary mt-3" (click)="editPost()">
                <i class="fa fa-edit me-2"></i>Continue Creating
              </button>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <!-- Post Info -->
          <div class="card bg-dark border-dark mb-3">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Post Information</h5>
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush">
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Type:</strong> {{ post.predictionType }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Created:</strong> {{ post.createdAt | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light" *ngIf="post.endDate">
                  <strong>Ends:</strong> {{ post.endDate | date:'medium' }}
                </li>
                <li class="list-group-item bg-transparent border-secondary text-light">
                  <strong>Status:</strong>
                  <span [class]="getStatusClass()">
                    {{ getStatusText() }}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Categories -->
          <div class="card bg-dark border-dark" *ngIf="post.categories && post.categories.length > 0">
            <div class="card-header bg-dark border-dark">
              <h5 class="text-light mb-0">Categories</h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                <span *ngFor="let category of post.categories"
                      class="badge bg-primary">
                  {{ category.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card bg-dark border-dark mb-4" *ngIf="isOwner()">
        <div class="card-header bg-dark border-dark">
          <h5 class="text-light mb-0">Actions</h5>
        </div>
        <div class="card-body">
          <div class="d-flex gap-2">
            <button *ngIf="post.isDraft" class="btn btn-primary" (click)="editPost()">
              <i class="fa fa-edit me-2"></i>Continue Editing
            </button>
            <button *ngIf="post.isDraft" class="btn btn-success" (click)="publishPost()">
              <i class="fa fa-globe me-2"></i>Publish Now
            </button>
            <button class="btn btn-danger" (click)="deletePost()">
              <i class="fa fa-trash me-2"></i>Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!post && isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading post...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!post && !isLoading" class="text-center py-5">
      <i class="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-warning">Post Not Found</h5>
      <p class="text-muted">The post you're looking for doesn't exist or has been removed.</p>
      <button class="btn btn-primary" (click)="goBack()">Go Back</button>
    </div>
  `,
  styles: [`
    .bingo-grid {
      max-width: 400px;
      margin: 0 auto;
    }

    .bingo-cell {
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60px;
    }

    .table-dark th,
    .table-dark td {
      border-color: #495057;
    }

    .card {
      border-radius: 8px;
    }

    .badge {
      font-size: 0.875rem;
    }

    pre {
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.8rem;
    }
  `]
})
export class PostViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  post: PostView | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const postId = +params['id'];
      if (postId) {
        this.loadPost(postId);
      }
    });
  }

  async loadPost(postId: number): Promise<void> {
    this.isLoading = true;
    try {
      // Try prediction endpoint first
      let response = await this.http.get<any>(
        `${environment.apiUrl}prediction/${postId}`
      ).toPromise().catch(() => null);

      if (response) {
        this.post = {
          id: response.id,
          title: response.title,
          description: response.description,
          predictionType: response.predictionType,
          createdAt: new Date(response.createdAt),
          endDate: response.endDate ? new Date(response.endDate) : undefined,
          isDraft: response.isDraft,
          isActive: response.isActive,
          author: response.author || { displayName: 'Unknown' },
          postRank: response.postRanks?.[0],
          postBracket: response.postBrackets?.[0],
          postBingo: response.postBingos?.[0],
          categories: response.categories || []
        };
      }

      console.log('Post loaded:', this.post);
    } catch (error) {
      console.error('Error loading post:', error);
      this.toastr.error('Failed to load post');
    } finally {
      this.isLoading = false;
    }
  }

  hasPostData(): boolean {
    return !!(this.post?.postRank || this.post?.postBracket || this.post?.postBingo);
  }

  isOwner(): boolean {
    // For now, assume all posts can be edited.
    // You can add proper user ownership check here
    return true;
  }

  getStatusText(): string {
    if (this.post?.isDraft) return 'Draft';
    if (this.post?.isActive) return 'Active';
    return 'Ended';
  }

  getStatusClass(): string {
    if (this.post?.isDraft) return 'text-warning';
    if (this.post?.isActive) return 'text-success';
    return 'text-secondary';
  }

  editPost(): void {
    if (this.post) {
      this.router.navigate(['/create-prediction'], {
        queryParams: { edit: this.post.id }
      });
    }
  }

  async publishPost(): Promise<void> {
    if (!this.post) return;

    if (!confirm('Are you sure you want to publish this prediction?')) {
      return;
    }

    try {
      await this.http.put(`${environment.apiUrl}prediction/${this.post.id}/publish`, {}).toPromise();
      this.toastr.success('Prediction published successfully!');
      this.loadPost(this.post.id); // Reload to get updated status
    } catch (error) {
      console.error('Error publishing post:', error);
      this.toastr.error('Failed to publish prediction');
    }
  }

  async deletePost(): Promise<void> {
    if (!this.post) return;

    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}prediction/${this.post.id}`).toPromise();
      this.toastr.success('Prediction deleted successfully');
      this.router.navigate(['/my-predictions']);
    } catch (error) {
      console.error('Error deleting post:', error);
      this.toastr.error('Failed to delete prediction');
    }
  }

  goBack(): void {
    this.router.navigate(['/my-predictions']);
  }
}
