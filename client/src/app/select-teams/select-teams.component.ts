// client/src/app/select-teams/select-teams.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../_models/team';
import { TeamService } from '../_services/team.service';
import { TemplateService } from '../_services/template.service';
import { ToastrService } from 'ngx-toastr';
import { PredictionType } from '../_models/predictionType';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-select-teams',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './select-teams.component.html',
  styleUrls: ['./select-teams.component.css']
})
export class SelectTeamsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);
  private templateService = inject(TemplateService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);

  predictionId: number = 0;
  templateId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;
  template: any = null;

  // Teams
  existingTeams: Team[] = [];
  userTeams: Team[] = [];
  selectedTeams: Team[] = [];

  // Team creation
  teamForm: FormGroup = new FormGroup({});
  showCreateForm = false;

  // Flow state
  isLoading = false;
  minimumTeamsRequired = 0;
  maximumTeamsAllowed = 0;

  ngOnInit(): void {
    this.initializeForm();
    this.loadRouteParams();
    this.loadTeams();
  }

  initializeForm(): void {
    this.teamForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9\s\-_.]+$/) // Allow letters, numbers, spaces, hyphens, underscores, dots
      ]],
      description: ['', [Validators.maxLength(1000)]],
      photoUrl: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]] // URL validation
    });
  }

  loadRouteParams(): void {
    this.route.params.subscribe(params => {
      this.predictionId = +params['predictionId'];
      this.templateId = +params['templateId'];
      this.predictionType = params['type'] as PredictionType;

      // Try to get template from navigation state first
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['template']) {
        this.template = navigation.extras.state['template'];
        console.log('Template loaded from navigation state:', this.template);
        this.calculateTeamRequirements();
      }
    });
  }

  async loadTemplate(): Promise<void> {
    // If template is already loaded from navigation state, skip this
    if (this.template) {
      console.log('Template already loaded:', this.template);
      return;
    }

    // Fallback: Load template from service if not passed via navigation
    console.log('Loading template from service as fallback...');

    // Load template based on type
    switch (this.predictionType) {
      case PredictionType.Ranking:
        // Ensure templates are loaded first
        await this.templateService.getOfficialAndUserRankingTemplates();
        this.template = this.templateService.userRankingTemplates().find(t => t.id === this.templateId) ||
                      this.templateService.officialRankingTemplates().find(t => t.id === this.templateId);
        break;
      case PredictionType.Bracket:
        await this.templateService.getOfficialAndUserBracketTemplates();
        this.template = this.templateService.userBracketTemplates().find(t => t.id === this.templateId) ||
                      this.templateService.officialBracketTemplates().find(t => t.id === this.templateId);
        break;
      case PredictionType.Bingo:
        await this.templateService.getOfficialAndUserBingoTemplates();
        this.template = this.templateService.userBingoTemplates().find(t => t.id === this.templateId) ||
                      this.templateService.officialBingoTemplates().find(t => t.id === this.templateId);
        break;
    }

    if (this.template) {
      console.log('Template loaded from service:', this.template);
    } else {
      console.error('Template not found with ID:', this.templateId);
      this.toastr.error('Template not found');
      this.goBack();
    }

    this.calculateTeamRequirements();
  }

  calculateTeamRequirements(): void {
    // Calculate based on template and prediction type
    if (this.template) {
      switch (this.predictionType) {
        case PredictionType.Ranking:
          this.minimumTeamsRequired = this.template.numberOfRows * this.template.numberOfColumns;
          this.maximumTeamsAllowed = this.minimumTeamsRequired * 2;
          break;
        case PredictionType.Bracket:
          this.minimumTeamsRequired = Math.pow(2, this.template.numberOfRounds);
          this.maximumTeamsAllowed = this.minimumTeamsRequired;
          break;
        case PredictionType.Bingo:
          this.minimumTeamsRequired = this.template.gridSize * this.template.gridSize;
          this.maximumTeamsAllowed = this.minimumTeamsRequired * 2;
          break;
      }
    }
  }

  async loadTeams(): Promise<void> {
    this.isLoading = true;
    try {
      // Ensure template is loaded first
      if (!this.template) {
        await this.loadTemplate();
      }

      // If still no template, show error and return
      if (!this.template) {
        this.toastr.error('Could not load template information');
        this.isLoading = false;
        return;
      }

      // Load user's teams
      await this.teamService.loadUserTeams();
      this.userTeams = this.teamService.teams();

      // Get teams already associated with this template
      this.existingTeams = this.template?.teams || [];

      // Pre-select existing teams if any
      this.selectedTeams = [...this.existingTeams];

      console.log('Teams loaded successfully:', {
        template: this.template,
        existingTeams: this.existingTeams.length,
        userTeams: this.userTeams.length,
        selectedTeams: this.selectedTeams.length
      });

    } catch (error) {
      console.error('Error loading teams:', error);
      this.toastr.error('Failed to load teams');
    } finally {
      this.isLoading = false;
    }
  }

  toggleTeamSelection(team: Team): void {
    const index = this.selectedTeams.findIndex(t => t.id === team.id);
    if (index > -1) {
      this.selectedTeams.splice(index, 1);
    } else {
      if (this.selectedTeams.length < this.maximumTeamsAllowed) {
        this.selectedTeams.push(team);
      } else {
        this.toastr.warning(`Maximum ${this.maximumTeamsAllowed} teams allowed`);
      }
    }
  }

  isTeamSelected(team: Team): boolean {
    return this.selectedTeams.some(t => t.id === team.id);
  }

  async createTeam(): Promise<void> {
    if (this.teamForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.teamForm.controls).forEach(key => {
        this.teamForm.get(key)?.markAsTouched();
      });
      this.toastr.error('Please fix the validation errors');
      return;
    }

    this.isLoading = true;
    try {
      const currentUser = this.accountService.currentUser();
      if (!currentUser) {
        this.toastr.error('You must be logged in to create teams');
        this.isLoading = false;
        return;
      }

      const formValue = this.teamForm.value;

      // Prepare team data with validation
      const teamData = {
        name: formValue.name?.trim() || '',
        description: formValue.description?.trim() || '',
        photoUrl: formValue.photoUrl?.trim() || '',
        score: 0,
        templateId: this.templateId
      };

      // Additional validation
      if (!teamData.name || teamData.name.length < 2) {
        this.toastr.error('Team name must be at least 2 characters long');
        this.isLoading = false;
        return;
      }

      if (teamData.name.length > 100) {
        this.toastr.error('Team name must be less than 100 characters');
        this.isLoading = false;
        return;
      }

      // Check for duplicate team names
      const duplicateTeam = [...this.userTeams, ...this.existingTeams].find(
        team => team.name.toLowerCase() === teamData.name.toLowerCase()
      );

      if (duplicateTeam) {
        this.toastr.error('A team with this name already exists');
        this.isLoading = false;
        return;
      }

      console.log('Creating team with data:', teamData);

      const newTeam = await this.teamService.createTeam(teamData);

      this.userTeams.push(newTeam);
      this.selectedTeams.push(newTeam);
      this.teamForm.reset();
      this.showCreateForm = false;
      this.toastr.success(`Team "${newTeam.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating team:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to create team';

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.toastr.error(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  canProceed(): boolean {
    return this.selectedTeams.length >= this.minimumTeamsRequired;
  }

  proceedToPost(): void {
    if (this.canProceed()) {
      // Navigate to create-post with selected teams
      this.router.navigate(['/create-post', this.predictionId, this.templateId, this.predictionType], {
        state: { selectedTeams: this.selectedTeams }
      });
    }
  }

  abandonFlow(): void {
    if (confirm('Are you sure you want to abandon this prediction? All progress will be lost.')) {
      // Call abandonment service
      this.router.navigate(['/']);
    }
  }

  goBack(): void {
    this.router.navigate(['/edit-template', this.predictionId, this.predictionType]);
  }

  // Helper methods for form validation display
  isFieldInvalid(fieldName: string): boolean {
    const field = this.teamForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['pattern']) return `${fieldName} contains invalid characters`;
    }
    return '';
  }
}
