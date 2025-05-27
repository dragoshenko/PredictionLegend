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
  isCreatingTeam = false; // FIXED: Separate loading state for team creation
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
        this.teamNameValidator.bind(this) // FIXED: Custom validator for duplicate names
      ]],
      description: ['', [Validators.maxLength(500)]],
      photoUrl: ['', [this.urlValidator]] // FIXED: Custom URL validator
    });
  }

  // FIXED: Custom validator for team names
  teamNameValidator(control: any) {
    if (!control.value) return null;

    const name = control.value.trim().toLowerCase();
    const exists = this.teamService.hasTeamWithName(name);

    return exists ? { duplicate: true } : null;
  }

  // FIXED: Custom URL validator
  urlValidator(control: any) {
    if (!control.value) return null;

    const urlPattern = /^https?:\/\/.+\..+/;
    return urlPattern.test(control.value) ? null : { invalidUrl: true };
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
    if (this.template) {
      console.log('Template already loaded:', this.template);
      return;
    }

    console.log('Loading template from service as fallback...');

    switch (this.predictionType) {
      case PredictionType.Ranking:
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
      if (!this.template) {
        await this.loadTemplate();
      }

      if (!this.template) {
        this.toastr.error('Could not load template information');
        this.isLoading = false;
        return;
      }

      // FIXED: Load user's teams and subscribe to changes
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
    // FIXED: Validate form first
    if (this.teamForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.error('Please fix the validation errors');
      return;
    }

    // FIXED: Check authentication
    const currentUser = this.accountService.currentUser();
    if (!currentUser) {
      this.toastr.error('You must be logged in to create teams');
      return;
    }

    // FIXED: Use separate loading state
    this.isCreatingTeam = true;

    try {
      const formValue = this.teamForm.value;

      // FIXED: Prepare clean data
      const teamData = {
        name: formValue.name?.trim() || '',
        description: formValue.description?.trim() || '',
        photoUrl: formValue.photoUrl?.trim() || '',
        score: 0
      };

      console.log('Creating team with data:', teamData);

      // FIXED: Call service and handle response properly
      const newTeam = await this.teamService.createTeam(teamData);

      console.log('Team created successfully:', newTeam);

      // FIXED: Update local state immediately
      this.userTeams = this.teamService.teams(); // Get updated teams from service
      this.selectedTeams.push(newTeam); // Add to selected teams

      // FIXED: Reset form properly
      this.teamForm.reset();
      this.teamForm.patchValue({
        name: '',
        description: '',
        photoUrl: ''
      });
      this.teamForm.markAsUntouched();
      this.teamForm.markAsPristine();

      this.showCreateForm = false;
      this.toastr.success(`Team "${newTeam.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating team:', error);

      // FIXED: Display the actual error message
      let errorMessage = 'Failed to create team';

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.toastr.error(errorMessage);

      // FIXED: If it's a duplicate error, reload teams to sync state
      if (errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('duplicate')) {
        try {
          await this.teamService.reloadTeams();
          this.userTeams = this.teamService.teams();
        } catch (reloadError) {
          console.error('Error reloading teams:', reloadError);
        }
      }
    } finally {
      this.isCreatingTeam = false;
    }
  }

  // FIXED: Helper method to mark all form fields as touched
  private markFormGroupTouched(): void {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  canProceed(): boolean {
    return this.selectedTeams.length >= this.minimumTeamsRequired;
  }

  proceedToPost(): void {
    if (this.canProceed()) {
      this.router.navigate(['/create-post', this.predictionId, this.templateId, this.predictionType], {
        state: { selectedTeams: this.selectedTeams }
      });
    }
  }

  abandonFlow(): void {
    if (confirm('Are you sure you want to abandon this prediction? All progress will be lost.')) {
      this.router.navigate(['/']);
    }
  }

  goBack(): void {
    this.router.navigate(['/edit-template', this.predictionId, this.predictionType]);
  }

  // FIXED: Helper methods for template access
  isFieldInvalid(fieldName: string): boolean {
    const field = this.teamForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['duplicate']) return 'You already have a team with this name';
      if (field.errors['invalidUrl']) return 'Please enter a valid URL';
    }
    return '';
  }

  // FIXED: Method to toggle create form
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.teamForm.reset();
      this.teamForm.markAsUntouched();
      this.teamForm.markAsPristine();
    }
  }
}
