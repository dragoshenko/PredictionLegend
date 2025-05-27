import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

interface UserPost {
  id: number;
  title: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  isDraft: boolean;
  isActive: boolean;
  counterPredictionsCount: number;
  notes?: string;
}

@Component({
  selector: 'app-my-predictions',
  imports: [CommonModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-user me-2"></i>My Predictions
              </h2>
              <p class="text-light mb-0 opacity-75">
                Manage your predictions and see how others are counter-predicting
              </p>
            </div>
            <button class="btn btn-outline-light" routerLink="/create-prediction">
              <i class="fa fa-plus me-2"></i>Create New Prediction
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card bg-success border-success">
            <div class="card-body text-center">
              <i class="fa fa-check-circle fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ publishedCount }}</h4>
              <p class="text-light mb-0">Published</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-warning border-warning">
            <div class="card-body text-center">
              <i class="fa fa-edit fa-2x text-dark mb-2"></i>
              <h4 class="text-dark">{{ draftCount }}</h4>
              <p class="text-dark mb-0">Drafts</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-info border-info">
            <div class="card-body text-center">
              <i class="fa fa-users fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ totalCounterPredictions }}</h4>
              <p class="text-light mb-0">Total Counter Predictions</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card bg-secondary border-secondary">
            <div class="card-body text-center">
              <i class="fa fa-clock-o fa-2x text-light mb-2"></i>
              <h4 class="text-light">{{ activeCount }}</h4>
              <p class="text-light mb-0">Active</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="card bg-secondary border-secondary mb-4">
        <div class="card-body">
          <ul class="nav nav-pills">
            <li class="nav-item">
              <button class="nav-link"
                      [class.active]="activeTab === 'all'"
                      (click)="setActiveTab('all')">
                All ({{ userPosts.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link"
                      [class.active]="activeTab === 'published'"
                      (click)="setActiveTab('published')">
                Published ({{ publishedCount }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link"
                      [class.active]="activeTab === 'drafts'"
                      (click)="setActiveTab('drafts')">
                Drafts ({{ draftCount }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link"
                      [class.active]="activeTab === 'active'"
                      (click)="setActiveTab('active')">
                Active ({{ activeCount }})
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Predictions List -->
      <div class="row" *ngIf="filteredPosts.length > 0">
        <div class="col-lg-6 mb-4" *ngFor="let post of filteredPosts">
          <div class="card bg-dark border-dark h-100">
            <div class="card-header bg-dark border-dark">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="card-title text-light mb-1">{{ post.title }}</h6>
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa"
                       [ngClass]="{
                         'fa-list-ol': post.predictionType === 'Ranking',
                         'fa-sitemap': post.predictionType === 'Bracket',
                         'fa-th': post.predictionType === 'Bingo'
                       }" class="text-primary me-1"></i>
                    <span class="badge bg-primary">{{ post.predictionType }}</span>
                    <span class="badge"
                          [class.bg-success]="!post.isDraft && post.isActive"
                          [class.bg-warning]="post.isDraft"
                          [class.bg-secondary]="!post.isDraft && !post.isActive">
                      {{ post.isDraft ? 'Draft' : (post.isActive ? 'Active' : 'Ended') }}
                    </span>
                  </div>
                </div>
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-light dropdown-toggle"
                          type="button"
                          [id]="'dropdown-' + post.id"
                          data-bs-toggle="dropdown">
                    <i class="fa fa-ellipsis-v"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <button class="dropdown-item" (click)="viewPrediction(post.id)">
                        <i class="fa fa-eye me-2"></i>View Details
                      </button>
                    </li>
                    <li *ngIf="post.isDraft">
                      <button class="dropdown-item" (click)="editPrediction(post.id)">
                        <i class="fa fa-edit me-2"></i>Edit
                      </button>
                    </li>
                    <li *ngIf="post.isDraft">
                      <button class="dropdown-item" (click)="publishPrediction(post.id)">
                        <i class="fa fa-globe me-2"></i>Publish
                      </button>
                    </li>
                    <li>
                      <hr class="dropdown-divider">
                    </li>
                    <li>
                      <button class="dropdown-item text-danger" (click)="deletePrediction(post.id)">
                        <i class="fa fa-trash me-2"></i>Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="card-body">
              <div class="row">
                <div class="col-8">
                  <div class="small text-muted mb-2">
                    Created: {{ post.createdAt | date:'short' }}
                  </div>
                  <div *ngIf="post.endDate" class="small text-muted mb-2">
                    Ends: {{ post.endDate | date:'short' }}
                  </div>
                  <div *ngIf="post.notes" class="small text-light">
                    <strong>Notes:</strong> {{ post.notes | slice:0:100 }}{{ post.notes.length > 100 ? '...' : '' }}
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="d-flex flex-column align-items-end">
                    <div class="badge bg-info mb-2">
                      <i class="fa fa-users me-1"></i>
                      {{ post.counterPredictionsCount }}
                    </div>
                    <div class="small text-muted">
                      Counter Predictions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer bg-transparent border-dark">
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-primary btn-sm" (click)="viewPrediction(post.id)">
                  <i class="fa fa-eye me-1"></i>
                  {{ post.isDraft ? 'Preview' : 'View' }}
                </button>

                <div class="btn-group">
                  <button *ngIf="post.isDraft"
                          class="btn btn-success btn-sm"
                          (click)="editPrediction(post.id)">
                    <i class="fa fa-edit me-1"></i>Continue Editing
                  </button>
                  <button *ngIf="!post.isDraft && post.counterPredictionsCount > 0"
                          class="btn btn-info btn-sm"
                          (click)="viewCounterPredictions(post.id)">
                    <i class="fa fa-users me-1"></i>View Responses
                  </button>
                </div>
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
        <p class="mt-3 text-muted">Loading your predictions...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredPosts.length === 0 && !isLoading" class="text-center py-5">
        <i class="fa fa-lightbulb-o fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">{{ getEmptyStateTitle() }}</h5>
        <p class="text-muted">{{ getEmptyStateMessage() }}</p>
        <button class="btn btn-primary" routerLink="/create-prediction">
          <i class="fa fa-plus me-2"></i>Create Your First Prediction
        </button>
      </div>
    </div>
  `,
  styles: [`
    .nav-pills .nav-link {
      color: #adb5bd;
      background: transparent;
      border-radius: 6px;
      margin-right: 0.5rem;
    }

    .nav-pills .nav-link.active {
      background-color: #0d6efd;
      color: white;
    }

    .nav-pills .nav-link:hover {
      background-color: rgba(13, 110, 253, 0.1);
      color: #0d6efd;
    }

    .card {
      transition: transform 0.2s ease;
      border-radius: 8px;
    }

    .card:hover {
      transform: translateY(-2px);
    }

    .dropdown-menu {
      background-color: #343a40;
      border-color: #495057;
    }

    .dropdown-item {
      color: #fff;
    }

    .dropdown-item:hover {
      background-color: #495057;
      color: #fff;
    }

    .dropdown-item.text-danger:hover {
      background-color: #dc3545;
    }
  `]
})
export class MyPredictionsComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  userPosts: UserPost[] = [];
  filteredPosts: UserPost[] = [];
  isLoading = false;
  activeTab: 'all' | 'published' | 'drafts' | 'active' = 'all';

  // Computed properties
  get publishedCount(): number {
    return this.userPosts.filter(p => !p.isDraft).length;
  }

  get draftCount(): number {
    return this.userPosts.filter(p => p.isDraft).length;
  }

  get activeCount(): number {
    return this.userPosts.filter(p => !p.isDraft && p.isActive).length;
  }

  get totalCounterPredictions(): number {
    return this.userPosts.reduce((sum, p) => sum + p.counterPredictionsCount, 0);
  }

  ngOnInit(): void {
    this.loadUserPosts();
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

      const response = await this.http.get<UserPost[]>(
        `${environment.apiUrl}post/user/${currentUser.id}`
      ).toPromise();

      if (response) {
        this.userPosts = response;
        this.filterPosts();
        console.log('User posts loaded:', this.userPosts);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
      this.toastr.error('Failed to load your predictions');

      // Mock data for development
      this.userPosts = this.getMockUserPosts();
      this.filterPosts();
    } finally {
      this.isLoading = false;
    }
  }

  setActiveTab(tab: 'all' | 'published' | 'drafts' | 'active'): void {
    this.activeTab = tab;
    this.filterPosts();
  }

  filterPosts(): void {
    switch (this.activeTab) {
      case 'published':
        this.filteredPosts = this.userPosts.filter(p => !p.isDraft);
        break;
      case 'drafts':
        this.filteredPosts = this.userPosts.filter(p => p.isDraft);
        break;
      case 'active':
        this.filteredPosts = this.userPosts.filter(p => !p.isDraft && p.isActive);
        break;
      default:
        this.filteredPosts = [...this.userPosts];
    }
  }

  viewPrediction(predictionId: number): void {
    this.router.navigate(['/prediction-details', predictionId]);
  }

  editPrediction(predictionId: number): void {
    // Navigate back to the creation flow for editing
    this.router.navigate(['/create-prediction'], {
      queryParams: { edit: predictionId }
    });
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
      this.loadUserPosts(); // Refresh the list
    } catch (error) {
      console.error('Error publishing prediction:', error);
      this.toastr.error('Failed to publish prediction');
    }
  }

  async deletePrediction(predictionId: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}prediction/${predictionId}`).toPromise();
      this.toastr.success('Prediction deleted successfully');
      this.loadUserPosts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting prediction:', error);
      this.toastr.error('Failed to delete prediction');
    }
  }

  getEmptyStateTitle(): string {
    switch (this.activeTab) {
      case 'published': return 'No Published Predictions';
      case 'drafts': return 'No Draft Predictions';
      case 'active': return 'No Active Predictions';
      default: return 'No Predictions Yet';
    }
  }

  getEmptyStateMessage(): string {
    switch (this.activeTab) {
      case 'published': return 'You haven\'t published any predictions yet. Publish your drafts to let others counter-predict!';
      case 'drafts': return 'You don\'t have any draft predictions. Start creating one to save your progress.';
      case 'active': return 'You don\'t have any active predictions. Published predictions that haven\'t ended will appear here.';
      default: return 'Start by creating your first prediction and see how others respond!';
    }
  }

  private getMockUserPosts(): UserPost[] {
    return [
      {
        id: 1,
        title: "My Premier League Predictions",
        predictionType: "Ranking",
        createdAt: new Date('2024-08-15'),
        endDate: new Date('2025-05-25'),
        isDraft: false,
        isActive: true,
        counterPredictionsCount: 12,
        notes: "Based on summer transfers"
      },
      {
        id: 2,
        title: "Oscar Winners 2025 - Draft",
        predictionType: "Ranking",
        createdAt: new Date('2024-12-01'),
        endDate: new Date('2025-03-10'),
        isDraft: true,
        isActive: false,
        counterPredictionsCount: 0,
        notes: "Still working on this..."
      }
    ];
  }
}
