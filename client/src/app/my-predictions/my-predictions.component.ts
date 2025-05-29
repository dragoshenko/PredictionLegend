import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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

interface PublishedPost {
  id: number;
  title: string;
  description: string;
  predictionType: string;
  createdAt: Date;
  endDate?: Date;
  author: any;
  categories: any[];
  counterPredictionsCount: number;
  canCounterPredict: boolean;
  isActive: boolean;
  notes?: string;
}

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-predictions.component.html',
  styleUrls: ['./my-predictions.component.css']
})
export class MyPredictionsComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private accountService = inject(AccountService);

  userPosts: UserPost[] = [];
  filteredPosts: UserPost[] = [];
  publishedPosts: PublishedPost[] = [];
  isLoading = false;
  activeTab: 'all' | 'published' | 'drafts' | 'active' = 'all';
  showDebugInfo = false;
  debugInfo: any = null;

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

      console.log('Loading posts for user:', currentUser.id);

      await Promise.all([
        this.loadFromUserPostsEndpoint(currentUser.id),
        this.loadFromPublishedPostsEndpoint(),
        this.loadFromPredictionsEndpoint(currentUser.id)
      ]);

    } catch (error) {
      console.error('Error loading user posts:', error);
      this.toastr.error('Failed to load your predictions');
      this.userPosts = this.getMockUserPosts();
      this.filterPosts();
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFromUserPostsEndpoint(userId: number): Promise<void> {
    try {
      console.log('Trying user posts endpoint...');
      let response = await this.http.get<UserPost[]>(
        `${environment.apiUrl}post/my-posts`
      ).toPromise().catch(() => null);

      if (!response) {
        response = await this.http.get<UserPost[]>(
          `${environment.apiUrl}post/user/${userId}`
        ).toPromise().catch(() => null);
      }

      console.log('User posts endpoint response:', response);
      if (response && response.length > 0) {
        this.userPosts = response.map(post => ({
          ...post,
          createdAt: new Date(post.createdAt),
          endDate: post.endDate ? new Date(post.endDate) : undefined
        }));
        this.debugInfo = { endpoint: 'user-posts', data: response };
        this.filterPosts();
        console.log('Successfully loaded from user posts endpoint:', this.userPosts);
      }
    } catch (error) {
      console.log('User posts endpoint failed:', error);
    }
  }

  private async loadFromPublishedPostsEndpoint(): Promise<void> {
    try {
      console.log('Trying published posts endpoint...');
      const response = await this.http.get<PublishedPost[]>(
        `${environment.apiUrl}post/published`
      ).toPromise();

      console.log('Published posts endpoint response:', response);
      if (response && response.length > 0) {
        this.publishedPosts = response;
        const currentUser = this.accountService.currentUser();
        if (currentUser) {
          const userPublishedPosts = response
            .filter(post => post.author.id === currentUser.id || post.author.displayName === currentUser.displayName)
            .map(post => ({
              id: post.id,
              title: post.title,
              predictionType: post.predictionType,
              createdAt: new Date(post.createdAt),
              endDate: post.endDate ? new Date(post.endDate) : undefined,
              isDraft: false,
              isActive: post.isActive,
              counterPredictionsCount: post.counterPredictionsCount,
              notes: post.notes
            }));

          if (userPublishedPosts.length > 0) {
            this.userPosts = [...this.userPosts, ...userPublishedPosts];
            this.debugInfo = { endpoint: 'published-posts', data: response, filtered: userPublishedPosts };
            this.filterPosts();
            console.log('Successfully loaded from published posts endpoint:', userPublishedPosts);
          }
        }
      }
    } catch (error) {
      console.log('Published posts endpoint failed:', error);
    }
  }

  private async loadFromPredictionsEndpoint(userId: number): Promise<void> {
    try {
      console.log('Trying predictions endpoint...');
      const response = await this.http.get<any[]>(
        `${environment.apiUrl}prediction/rank/user/${userId}`
      ).toPromise();

      console.log('Predictions endpoint response:', response);
      if (response && response.length > 0) {
        const predictionPosts = response.map(prediction => ({
          id: prediction.id,
          title: prediction.title || 'Untitled Prediction',
          predictionType: prediction.predictionType || 'Ranking',
          createdAt: new Date(prediction.createdAt),
          endDate: prediction.endDate ? new Date(prediction.endDate) : undefined,
          isDraft: prediction.isDraft !== false,
          isActive: prediction.isActive !== false,
          counterPredictionsCount: prediction.postRankings?.length || 0,
          notes: prediction.description || ''
        }));

        this.userPosts = [...this.userPosts, ...predictionPosts];
        this.debugInfo = { endpoint: 'predictions', data: response, processed: predictionPosts };
        this.filterPosts();
        console.log('Successfully loaded from predictions endpoint:', predictionPosts);
      }
    } catch (error) {
      console.log('Predictions endpoint failed:', error);
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

    this.filteredPosts = this.filteredPosts.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    );

    console.log('Filtered posts:', this.filteredPosts);
  }

  async viewPrediction(predictionId: number): Promise<void> {
    try {
      console.log('Viewing prediction:', predictionId);
      this.router.navigate(['/prediction-details', predictionId]);
    } catch (error) {
      console.error('Error viewing prediction:', error);
      this.toastr.error('Failed to load prediction');
    }
  }

  async debugLoadPrediction(predictionId: number): Promise<void> {
    try {
      console.log('=== DEBUG: Loading prediction data ===');
      const response = await this.http.get<any>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      console.log('=== DEBUG: Raw API Response ===');
      console.log(response);

      if (response?.postRanks) {
        console.log('=== DEBUG: PostRanks Data ===');
        console.log('PostRanks count:', response.postRanks.length);
        response.postRanks.forEach((postRank: any, index: number) => {
          console.log(`PostRank ${index}:`, postRank);
          if (postRank.rankTable) {
            console.log(`  - RankTable rows: ${postRank.rankTable.rows?.length || 0}`);
            postRank.rankTable.rows?.forEach((row: any, rowIndex: number) => {
              console.log(`    Row ${rowIndex} (order ${row.order}): ${row.columns?.length || 0} columns`);
              row.columns?.forEach((col: any, colIndex: number) => {
                if (col.team) {
                  console.log(`      Column ${colIndex}: Team "${col.team.name}"`);
                } else {
                  console.log(`      Column ${colIndex}: Empty`);
                }
              });
            });
          }
        });
      }

      if (response?.postBingos) {
        console.log('=== DEBUG: PostBingos Data ===');
        console.log('PostBingos count:', response.postBingos.length);
        response.postBingos.forEach((postBingo: any, index: number) => {
          console.log(`PostBingo ${index}:`, postBingo);
          console.log(`  - Grid size: ${postBingo.gridSize}`);
          console.log(`  - Cells count: ${postBingo.bingoCells?.length || 0}`);
          const cellsWithTeams = postBingo.bingoCells?.filter((cell: any) => cell.team).length || 0;
          console.log(`  - Cells with teams: ${cellsWithTeams}`);
        });
      }

      this.toastr.success('Check console for detailed debug info');
    } catch (error) {
      console.error('=== DEBUG: Error loading prediction ===', error);
      this.toastr.error('Debug load failed - check console');
    }
  }

  async editPrediction(predictionId: number): Promise<void> {
    try {
      console.log('Loading prediction for editing:', predictionId);
      const detailedPrediction = await this.http.get<any>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      console.log('Prediction data for editing:', detailedPrediction);

      if (detailedPrediction) {
        this.router.navigate(['/create-prediction'], {
          queryParams: { edit: predictionId },
          state: {
            existingData: detailedPrediction,
            isEdit: true
          }
        });
      } else {
        this.router.navigate(['/create-prediction'], {
          queryParams: { edit: predictionId }
        });
      }
    } catch (error) {
      console.error('Error loading prediction for editing:', error);
      this.toastr.error('Failed to load prediction for editing');
    }
  }

  async viewPostData(predictionId: number, predictionType: string): Promise<void> {
    try {
      const detailedPrediction = await this.http.get<any>(
        `${environment.apiUrl}post/prediction/${predictionId}/with-posts`
      ).toPromise();

      if (detailedPrediction) {
        console.log(`${predictionType} post data:`, detailedPrediction);

        switch (predictionType) {
          case 'Ranking':
            console.log('PostRanks:', detailedPrediction.postRanks);
            if (detailedPrediction.postRanks && detailedPrediction.postRanks.length > 0) {
              const originalPost = detailedPrediction.postRanks.find(
                (pr: any) => pr.userId === detailedPrediction.userId
              );
              console.log('Original ranking post:', originalPost);
              if (originalPost?.rankTable?.rows) {
                console.log('Ranking table rows:', originalPost.rankTable.rows);
              }
            }
            break;

          case 'Bracket':
            console.log('PostBrackets:', detailedPrediction.postBrackets);
            break;

          case 'Bingo':
            console.log('PostBingos:', detailedPrediction.postBingos);
            if (detailedPrediction.postBingos && detailedPrediction.postBingos.length > 0) {
              const originalPost = detailedPrediction.postBingos.find(
                (pb: any) => pb.userId === detailedPrediction.userId
              );
              console.log('Original bingo post:', originalPost);
              if (originalPost?.bingoCells) {
                console.log('Bingo cells:', originalPost.bingoCells);
              }
            }
            break;
        }

        this.router.navigate(['/post-view', predictionId], {
          state: {
            postData: detailedPrediction,
            postType: predictionType.toLowerCase()
          }
        });
      }
    } catch (error) {
      console.error('Error loading post data:', error);
      this.toastr.error('Failed to load post data');
    }
  }

  viewCounterPredictions(predictionId: number): void {
    if (this.doesRouteExist('/prediction-details')) {
      this.router.navigate(['/prediction-details', predictionId], {
        fragment: 'counter-predictions'
      });
    } else {
      this.toastr.info('Counter predictions view not yet implemented');
    }
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

  async deletePrediction(predictionId: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}prediction/${predictionId}`).toPromise();
      this.toastr.success('Prediction deleted successfully');
      this.loadUserPosts();
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

  private doesRouteExist(route: string): boolean {
    return true;
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
