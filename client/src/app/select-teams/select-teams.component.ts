// Fixed select-teams.component.ts
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
  isCreatingTeam = false;
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
        this.teamNameValidator.bind(this)
      ]],
      description: ['', [Validators.maxLength(500)]],
      photoUrl: ['', [this.urlValidator]]
    });
  }

  teamNameValidator(control: any) {
    if (!control.value) return null;
    const name = control.value.trim().toLowerCase();
    const exists = this.teamService.hasTeamWithName(name);
    return exists ? { duplicate: true } : null;
  }

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

      console.log('Route params loaded:', {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionType
      });

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

      console.log('Team requirements calculated:', {
        minimum: this.minimumTeamsRequired,
        maximum: this.maximumTeamsAllowed
      });
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

      await this.teamService.loadUserTeams();
      this.userTeams = this.teamService.teams();
      this.existingTeams = this.template?.teams || [];
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

    console.log('Team selection updated:', {
      selectedCount: this.selectedTeams.length,
      canProceed: this.canProceed()
    });
  }

  isTeamSelected(team: Team): boolean {
    return this.selectedTeams.some(t => t.id === team.id);
  }

  async createTeam(): Promise<void> {
    if (this.teamForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.error('Please fix the validation errors');
      return;
    }

    const currentUser = this.accountService.currentUser();
    if (!currentUser) {
      this.toastr.error('You must be logged in to create teams');
      return;
    }

    this.isCreatingTeam = true;

    try {
      const formValue = this.teamForm.value;
      const teamData = {
        name: formValue.name?.trim() || '',
        description: formValue.description?.trim() || '',
        photoUrl: formValue.photoUrl?.trim() || '',
        score: 0
      };

      console.log('Creating team with data:', teamData);
      const newTeam = await this.teamService.createTeam(teamData);
      console.log('Team created successfully:', newTeam);

      this.userTeams = this.teamService.teams();
      this.selectedTeams.push(newTeam);

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
      let errorMessage = 'Failed to create team';

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.toastr.error(errorMessage);

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

  private markFormGroupTouched(): void {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  canProceed(): boolean {
    const result = this.selectedTeams.length >= this.minimumTeamsRequired;
    console.log('Can proceed check:', {
      selectedTeams: this.selectedTeams.length,
      minimumRequired: this.minimumTeamsRequired,
      canProceed: result
    });
    return result;
  }

  // FIXED: Enhanced proceedToPost method with better logging and validation
  proceedToPost(): void {
    console.log('proceedToPost called');
    console.log('Current state:', {
      predictionId: this.predictionId,
      templateId: this.templateId,
      predictionType: this.predictionType,
      selectedTeams: this.selectedTeams.length,
      canProceed: this.canProceed(),
      template: this.template
    });

    // Validate all required data
    if (!this.predictionId || !this.templateId || !this.predictionType) {
      console.error('Missing required route parameters');
      this.toastr.error('Missing required information. Please start over.');
      return;
    }

    if (!this.canProceed()) {
      console.error('Cannot proceed - not enough teams selected');
      this.toastr.error(`Please select at least ${this.minimumTeamsRequired} teams to continue`);
      return;
    }

    if (!this.template) {
      console.error('Template not loaded');
      this.toastr.error('Template information is missing. Please go back and select a template.');
      return;
    }

    // Prepare navigation
    const navigationRoute = ['/create-post', this.predictionId, this.templateId, this.predictionType];
    const navigationExtras = {
      state: {
        selectedTeams: this.selectedTeams,
        template: this.template,
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionType
      }
    };

    console.log('Navigating to:', navigationRoute);
    console.log('With state:', navigationExtras.state);

    try {
      this.router.navigate(navigationRoute, navigationExtras).then(
        (success) => {
          console.log('Navigation result:', success);
          if (!success) {
            console.error('Navigation failed');
            this.toastr.error('Navigation failed. Please try again.');
          }
        }
      ).catch(error => {
        console.error('Navigation error:', error);
        this.toastr.error('Navigation error. Please try again.');
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      this.toastr.error('An error occurred during navigation');
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

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.teamForm.reset();
      this.teamForm.markAsUntouched();
      this.teamForm.markAsPristine();
    }
  }
}
