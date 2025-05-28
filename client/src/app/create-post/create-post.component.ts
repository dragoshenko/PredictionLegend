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
  isWrong?: boolean;
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
  predictionType: PredictionType | string; // Allow both enum and string
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
  predictionTypeEnumMap = {
    [PredictionType.Ranking]: 0,
    [PredictionType.Bracket]: 1,
    [PredictionType.Bingo]: 2,
  };

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

  // FINAL VERSION: Replace your submitPost method with this properly typed version

async submitPost(): Promise<void> {
  if (!this.isValidPost()) {
    this.toastr.error('Please assign teams to at least some positions');
    return;
  }

  this.isSubmitting = true;

  try {
    console.log('=== SUBMITTING POST ===');
    console.log('predictionId:', this.predictionId);
    console.log('templateId:', this.templateId);
    console.log('predictionType:', this.predictionType);

    // Validate required data
    if (!this.postRank || !this.template) {
      this.toastr.error('Missing required data. Please refresh and try again.');
      this.isSubmitting = false;
      return;
    }

    // Create the request payload matching your backend DTO exactly
    const publishRequest = {
      predictionId: this.predictionId,
      templateId: this.templateId,
      predictionType: this.predictionTypeEnumMap[this.predictionType], // This should be the enum value
      notes: this.postForm.get('notes')?.value || '',
      isDraft: this.postForm.get('isDraft')?.value || false,
      postRank: {
        id: 0,
        rankingTemplateId: this.templateId,
        predictionId: this.predictionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 0, // Will be set by server
        rankTable: {
          id: 0,
          numberOfRows: this.postRank.rankTable.numberOfRows,
          numberOfColumns: this.postRank.rankTable.numberOfColumns,
          rows: this.postRank.rankTable.rows.map((row, rowIndex) => ({
            id: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: row.order,
            isWrong: false,
            columns: row.columns.map((column, colIndex) => ({
              id: 0,
              team: column.team ? {
                id: column.team.id,
                name: column.team.name,
                description: column.team.description || '',
                //photoUrl: column.team.photoUrl || '',
                score: column.team.score || 0,
                createdByUserId: column.team.createdByUserId,
                createdAt: column.team.createdAt
              } : null,
              officialScore: 0,
              order: colIndex
            }))
          }))
        },
        teams: this.selectedTeams.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          //photoUrl: team.photoUrl || '',
          score: team.score || 0,
          createdByUserId: team.createdByUserId,
          createdAt: team.createdAt
        })),
        isOfficialResult: false,
        totalScore: 0
      }
    };

    console.log('Request payload:', JSON.stringify(publishRequest, null, 2));

    // Make the API call
    const response = await this.http.post(
      `${environment.apiUrl}post/rank/publish`,
      publishRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).toPromise();

    console.log('Success response:', response);

    const isDraft = this.postForm.get('isDraft')?.value;
    if (isDraft) {
      this.toastr.success('Prediction saved as draft successfully!');
    } else {
      this.toastr.success('Prediction published successfully!');
    }

    // Navigate to home or wherever appropriate
    this.router.navigate(['/']);

  } catch (error: any) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Full error:', error);
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('Error URL:', error.url);

    // DETAILED ERROR LOGGING
    if (error.error) {
      console.error('Error Body Type:', typeof error.error);
      console.error('Error Body:', error.error);

      if (Array.isArray(error.error)) {
        console.error('Error Array Length:', error.error.length);

      }
    }

    // Handle the error response with better debugging
    let errorMessage = 'Failed to publish prediction';

    if (error.status === 400) {
      console.log('400 Bad Request - analyzing error body...');

      if (error.error) {
        if (Array.isArray(error.error)) {
          console.log('Error is array:', error.error);
          errorMessage = `Validation errors: ${error.error.join(', ')}`;
        } else if (typeof error.error === 'string') {
          console.log('Error is string:', error.error);
          errorMessage = error.error;
        } else if (typeof error.error === 'object') {
          console.log('Error is object:', error.error);
          if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.title) {
            errorMessage = error.error.title;
          } else {
            // Try to extract meaningful error info from object
            const errorKeys = Object.keys(error.error);
            console.log('Error object keys:', errorKeys);
            errorMessage = `Server error: ${JSON.stringify(error.error)}`;
          }
        }
      } else {
        errorMessage = 'Bad request - no error details provided';
      }
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized to perform this action. Please log in again.';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found. Please check your server configuration.';
    } else if (error.status === 500) {
      errorMessage = 'Server error occurred. Please try again later.';
    } else if (error.status === 0) {
      errorMessage = 'Network error - cannot reach server. Check if the API is running.';
    }

    console.error('Final error message:', errorMessage);
    this.toastr.error(errorMessage);
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
