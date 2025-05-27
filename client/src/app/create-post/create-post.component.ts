import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../_models/team';
import { PredictionType } from '../_models/predictionType';
import { ToastrService } from 'ngx-toastr';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Optimized interfaces
interface RankColumn {
  team: Team | null;
  officialScore: number;
  order: number;
}

interface RankRow {
  order: number;
  columns: RankColumn[];
}

interface RankTable {
  numberOfRows: number;
  numberOfColumns: number;
  rows: RankRow[];
}

interface PostRankData {
  rankTable: RankTable;
  teams: Team[];
  totalScore: number;
  isOfficialResult: boolean;
}

interface PublishPostRequest {
  predictionId: number;
  templateId: number;
  predictionType: PredictionType;
  notes: string;
  isDraft: boolean;
  postRank?: PostRankData | null;
  postBracket?: any;
  postBingo?: any;
}

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Route parameters
  predictionId: number = 0;
  templateId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;
  template: any = null;
  selectedTeams: Team[] = [];

  // Post data
  postRank: PostRankData | null = null;

  // Forms
  postForm: FormGroup = new FormGroup({});

  // UI State
  isLoading = false;
  isSubmitting = false;

  // Track by functions for performance
  trackByTeamId = (index: number, team: Team): number => team.id;
  trackByRowIndex = (index: number, row: RankRow): number => row.order;
  trackByIndex = (index: number): number => index;

  ngOnInit(): void {
    this.initializeForm();
    this.loadRouteData();

    // Small delay to ensure navigation state is available
    setTimeout(() => {
      this.initializePostStructure();
    }, 50);
  }

  initializeForm(): void {
    this.postForm = this.fb.group({
      isDraft: [false],
      notes: ['']
    });
  }

  loadRouteData(): void {
    this.route.params.subscribe(params => {
      this.predictionId = +params['predictionId'];
      this.templateId = +params['templateId'];
      this.predictionType = params['type'] as PredictionType;
    });

    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.selectedTeams = navigation.extras.state['selectedTeams'] || [];
      this.template = navigation.extras.state['template'] || null;
    } else {
      // Fallback to browser history state
      const historyState = history.state;
      if (historyState?.selectedTeams) {
        this.selectedTeams = historyState.selectedTeams;
        this.template = historyState.template;
      } else {
        this.toastr.error('Missing required data. Redirecting back to team selection.');
        this.goBack();
        return;
      }
    }

    // Validate required data
    if (!this.selectedTeams?.length || !this.template) {
      this.toastr.error('Missing teams or template data. Please go back and try again.');
      this.goBack();
      return;
    }
  }

  initializePostStructure(): void {
    if (!this.template) return;

    if (this.predictionType === PredictionType.Ranking) {
      this.initializeRankingPost();
    }
    // Add other prediction types as needed
  }

  initializeRankingPost(): void {
    const numberOfRows = this.template?.numberOfRows || 10;
    const numberOfColumns = this.template?.numberOfColumns || 1;

    this.postRank = {
      rankTable: {
        numberOfRows,
        numberOfColumns,
        rows: []
      },
      teams: [...this.selectedTeams],
      totalScore: 0,
      isOfficialResult: false
    };

    // Initialize empty rows
    for (let i = 0; i < numberOfRows; i++) {
      const row: RankRow = {
        order: i + 1,
        columns: []
      };

      for (let j = 0; j < numberOfColumns; j++) {
        row.columns.push({
          team: null,
          officialScore: 0,
          order: j
        });
      }

      this.postRank.rankTable.rows.push(row);
    }
  }

  // Optimized drag & drop for Rankings
  dropTeamInRanking(event: CdkDragDrop<any>, rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    const targetSlot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (!targetSlot) return;

    // Check if dropping from available teams list
    if (event.previousContainer.id === 'available-teams') {
      const draggedTeam = event.item.data as Team;

      // Check if slot is empty
      if (!targetSlot.team) {
        targetSlot.team = draggedTeam;
        this.toastr.success(`${draggedTeam.name} assigned to rank ${rowIndex + 1}`);
      } else {
        this.toastr.warning('This position is already occupied');
      }
    } else {
      // Handle moving between ranking positions if needed
      // This would require more complex logic for swapping teams
    }
  }

  // Quick team assignment methods
  assignTeamToSlot(team: Team, rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    const slot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (slot && !slot.team) {
      slot.team = team;
      this.toastr.success(`${team.name} assigned to rank ${rowIndex + 1}`);
    }
  }

  removeTeamFromSlot(rowIndex: number, columnIndex: number): void {
    if (!this.postRank) return;

    const slot = this.postRank.rankTable.rows[rowIndex]?.columns[columnIndex];
    if (slot?.team) {
      const teamName = slot.team.name;
      slot.team = null;
      this.toastr.info(`${teamName} removed from ranking`);
    }
  }

  // Get available teams (not assigned to any position)
  getAvailableTeams(): Team[] {
    if (!this.postRank) return this.selectedTeams;

    const usedTeamIds = new Set<number>();

    this.postRank.rankTable.rows.forEach(row => {
      row.columns.forEach(col => {
        if (col.team) {
          usedTeamIds.add(col.team.id);
        }
      });
    });

    return this.selectedTeams.filter(team => !usedTeamIds.has(team.id));
  }

  // Quick action methods
  autoFillRanking(): void {
    if (!this.postRank) return;

    const availableTeams = this.getAvailableTeams();
    let teamIndex = 0;

    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < availableTeams.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < availableTeams.length; colIndex++) {
        const slot = this.postRank.rankTable.rows[rowIndex].columns[colIndex];
        if (!slot.team) {
          slot.team = availableTeams[teamIndex++];
        }
      }
    }

    this.toastr.success(`Auto-filled ${teamIndex} positions`);
  }

  clearAllRankings(): void {
    if (!this.postRank) return;

    this.postRank.rankTable.rows.forEach(row => {
      row.columns.forEach(col => {
        col.team = null;
      });
    });

    this.toastr.info('All rankings cleared');
  }

  shuffleTeams(): void {
    const availableTeams = this.getAvailableTeams();
    if (availableTeams.length === 0) return;

    // Shuffle the available teams array
    const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);

    // Clear current assignments
    this.clearAllRankings();

    // Assign shuffled teams
    if (!this.postRank) return;

    let teamIndex = 0;
    for (let rowIndex = 0; rowIndex < this.postRank.rankTable.rows.length && teamIndex < shuffled.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.postRank.rankTable.rows[rowIndex].columns.length && teamIndex < shuffled.length; colIndex++) {
        this.postRank.rankTable.rows[rowIndex].columns[colIndex].team = shuffled[teamIndex++];
      }
    }

    this.toastr.success('Teams shuffled randomly');
  }

  // Progress tracking
  getAssignedTeamsCount(): number {
    if (!this.postRank) return 0;

    let count = 0;
    this.postRank.rankTable.rows.forEach(row => {
      row.columns.forEach(col => {
        if (col.team) count++;
      });
    });

    return count;
  }

  getTotalSlotsCount(): number {
    if (!this.postRank) return 0;
    return this.postRank.rankTable.numberOfRows * this.postRank.rankTable.numberOfColumns;
  }

  getProgressPercentage(): number {
    const total = this.getTotalSlotsCount();
    if (total === 0) return 0;
    return Math.round((this.getAssignedTeamsCount() / total) * 100);
  }

  // Validation
  isValidPost(): boolean {
    if (!this.postRank) return false;

    // Check if at least some teams are assigned
    return this.postRank.rankTable.rows.some(row =>
      row.columns.some(col => col.team !== null)
    );
  }

  // Submit post - UPDATED WITH PUBLISHING LOGIC
  async submitPost(): Promise<void> {
    if (!this.isValidPost()) {
      this.toastr.error('Please assign teams to at least some positions');
      return;
    }

    this.isSubmitting = true;

    try {
      const publishRequest: PublishPostRequest = {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionType,
        notes: this.postForm.get('notes')?.value || '',
        isDraft: this.postForm.get('isDraft')?.value || false,
        postRank: this.predictionType === PredictionType.Ranking ? this.postRank : undefined
      };

      console.log('Publishing post with data:', publishRequest);

      // Call the new publish endpoint
      const response = await this.http.post(
        `${environment.apiUrl}post/rank/publish`,
        publishRequest
      ).toPromise();

      console.log('Publish response:', response);

      const isDraft = this.postForm.get('isDraft')?.value;

      if (isDraft) {
        this.toastr.success('Prediction saved as draft successfully!');
      } else {
        this.toastr.success('Prediction published successfully! Other users can now counter-predict.');
      }

      // Navigate to prediction details or user profile
      this.router.navigate(['/prediction-details', this.predictionId]);

    } catch (error) {
      console.error('Error publishing post:', error);
      this.toastr.error('Failed to publish prediction post');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/select-teams', this.predictionId, this.templateId, this.predictionType]);
  }

  abandonFlow(): void {
    if (confirm('Are you sure you want to abandon this prediction? All progress will be lost.')) {
      this.router.navigate(['/']);
    }
  }
}
