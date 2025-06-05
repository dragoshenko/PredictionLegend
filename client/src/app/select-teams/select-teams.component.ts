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

interface TeamPaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Component({
  selector: 'app-select-teams',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './select-teams.component.html',
  styleUrls: ['./select-teams.component.css'],
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
  filteredUserTeams: Team[] = [];
  paginatedUserTeams: Team[] = [];
  selectedTeams: Team[] = [];

  // Team Search and Filter
  teamSearchTerm = '';
  teamFilterType = 'all'; // 'all', 'selected', 'unselected'
  private searchTimeout: any;

  // Team Pagination
  teamPagination: TeamPaginationInfo = {
    currentPage: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  };

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
    this.route.params.subscribe(async params => {
      this.predictionId = +params['predictionId'];
      this.templateId = +params['templateId'];
      this.predictionType = params['type'] as PredictionType;

      console.log('Route params loaded:', {
        predictionId: this.predictionId,
        templateId: this.templateId,
        predictionType: this.predictionType
      });

      await this.loadTemplate();
    });
  }

  async loadTemplate(): Promise<void> {
    console.log('Loading template with ID:', this.templateId, 'Type:', this.predictionType);

    if (this.template) {
      console.log('Template already loaded:', this.template);
      this.calculateTeamRequirements();
      await this.loadTeams();
      return;
    }

    // Try to get template from navigation state first
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['template']) {
      this.template = navigation.extras.state['template'];
      console.log('Template loaded from navigation state:', this.template);
      this.calculateTeamRequirements();
      await this.loadTeams();
      return;
    }

    // Fallback: try browser history state
    const historyState = history.state;
    if (historyState?.template) {
      this.template = historyState.template;
      console.log('Template loaded from history state:', this.template);
      this.calculateTeamRequirements();
      await this.loadTeams();
      return;
    }

    console.log('Loading template from service as fallback...');

    try {
      // Load templates based on prediction type
      switch (this.predictionType) {
        case PredictionType.Ranking:
          console.log('Loading ranking templates...');
          await this.templateService.getOfficialAndUserRankingTemplates();

          const userRankingTemplates = this.templateService.userRankingTemplates();
          const officialRankingTemplates = this.templateService.officialRankingTemplates();

          console.log('Available ranking templates:', {
            user: userRankingTemplates,
            official: officialRankingTemplates,
            searchingForId: this.templateId
          });

          this.template = userRankingTemplates.find(t => t.id === this.templateId) ||
                         officialRankingTemplates.find(t => t.id === this.templateId);
          break;

        case PredictionType.Bracket:
          console.log('Loading bracket templates...');
          await this.templateService.getOfficialAndUserBracketTemplates();

          const userBracketTemplates = this.templateService.userBracketTemplates();
          const officialBracketTemplates = this.templateService.officialBracketTemplates();

          this.template = userBracketTemplates.find(t => t.id === this.templateId) ||
                         officialBracketTemplates.find(t => t.id === this.templateId);
          break;

        case PredictionType.Bingo:
          console.log('Loading bingo templates...');
          await this.templateService.getOfficialAndUserBingoTemplates();

          const userBingoTemplates = this.templateService.userBingoTemplates();
          const officialBingoTemplates = this.templateService.officialBingoTemplates();

          this.template = userBingoTemplates.find(t => t.id === this.templateId) ||
                         officialBingoTemplates.find(t => t.id === this.templateId);
          break;
      }

      if (this.template) {
        console.log('Template loaded from service:', this.template);
        this.calculateTeamRequirements();
        await this.loadTeams();
      } else {
        console.error('Template not found with ID:', this.templateId);
        // Create a fallback template with the ID as name
        this.template = {
          id: this.templateId,
          name: `Template ${this.templateId}`,
          numberOfRows: this.predictionType === PredictionType.Ranking ? 5 : undefined,
          numberOfColumns: this.predictionType === PredictionType.Ranking ? 1 : undefined,
          numberOfRounds: this.predictionType === PredictionType.Bracket ? 3 : undefined,
          gridSize: this.predictionType === PredictionType.Bingo ? 3 : undefined,
          teams: []
        };
        this.calculateTeamRequirements();
        this.toastr.warning('Template not found, using default settings');
        await this.loadTeams();
      }
    } catch (error) {
      console.error('Error loading template:', error);
      // Create a fallback template
      this.template = {
        id: this.templateId,
        name: `Template ${this.templateId}`,
        numberOfRows: this.predictionType === PredictionType.Ranking ? 5 : undefined,
        numberOfColumns: this.predictionType === PredictionType.Ranking ? 1 : undefined,
        numberOfRounds: this.predictionType === PredictionType.Bracket ? 3 : undefined,
        gridSize: this.predictionType === PredictionType.Bingo ? 3 : undefined,
        teams: []
      };
      this.calculateTeamRequirements();
      this.toastr.error('Failed to load template, using default settings');
      await this.loadTeams();
    }
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
        console.warn('Template not loaded, attempting to load...');
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

      // Apply filters and pagination after loading
      this.applyTeamFiltersAndPagination();

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

  // Team Search and Filter Methods
  onTeamSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.teamPagination.currentPage = 1; // Reset to first page
      this.applyTeamFiltersAndPagination();
    }, 300);
  }

  onTeamFilterChange(): void {
    this.teamPagination.currentPage = 1; // Reset to first page
    this.applyTeamFiltersAndPagination();
  }

  clearTeamSearch(): void {
    this.teamSearchTerm = '';
    this.teamPagination.currentPage = 1;
    this.applyTeamFiltersAndPagination();
  }

  clearAllTeamFilters(): void {
    this.teamSearchTerm = '';
    this.teamFilterType = 'all';
    this.teamPagination.currentPage = 1;
    this.applyTeamFiltersAndPagination();
  }

  hasActiveTeamFilters(): boolean {
    return !!(
      (this.teamSearchTerm && this.teamSearchTerm.trim() !== '') ||
      (this.teamFilterType && this.teamFilterType !== 'all')
    );
  }

  getTeamFilterDisplayName(): string {
    switch (this.teamFilterType) {
      case 'selected': return 'Selected Only';
      case 'unselected': return 'Unselected Only';
      case 'all':
      default: return 'All Teams';
    }
  }

  private applyTeamFilters(): void {
    let filtered = [...this.userTeams];

    // Apply search filter
    if (this.teamSearchTerm && this.teamSearchTerm.trim() !== '') {
      const searchLower = this.teamSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(team => {
        return team.name.toLowerCase().includes(searchLower) ||
               (team.description && team.description.toLowerCase().includes(searchLower));
      });
    }

    // Apply selection filter
    if (this.teamFilterType === 'selected') {
      filtered = filtered.filter(team => this.isTeamSelected(team));
    } else if (this.teamFilterType === 'unselected') {
      filtered = filtered.filter(team => !this.isTeamSelected(team));
    }

    this.filteredUserTeams = filtered;
  }

  private applyTeamPagination(): void {
    this.updateTeamPaginationInfo();

    if (this.teamPagination.pageSize >= 50) {
      // Show all
      this.paginatedUserTeams = this.filteredUserTeams;
    } else {
      const startIndex = (this.teamPagination.currentPage - 1) * this.teamPagination.pageSize;
      const endIndex = startIndex + this.teamPagination.pageSize;
      this.paginatedUserTeams = this.filteredUserTeams.slice(startIndex, endIndex);
    }
  }

  private updateTeamPaginationInfo(): void {
    this.teamPagination.totalItems = this.filteredUserTeams.length;
    this.teamPagination.totalPages = this.teamPagination.pageSize >= 50 ? 1 :
      Math.ceil(this.teamPagination.totalItems / this.teamPagination.pageSize);
    this.teamPagination.hasNext = this.teamPagination.currentPage < this.teamPagination.totalPages;
    this.teamPagination.hasPrevious = this.teamPagination.currentPage > 1;

    // Adjust current page if it's out of bounds
    if (this.teamPagination.currentPage > this.teamPagination.totalPages && this.teamPagination.totalPages > 0) {
      this.teamPagination.currentPage = this.teamPagination.totalPages;
    }
    if (this.teamPagination.currentPage < 1) {
      this.teamPagination.currentPage = 1;
    }
  }

  private applyTeamFiltersAndPagination(): void {
    this.applyTeamFilters();
    this.applyTeamPagination();
  }

  // Team Pagination Methods
  getTeamTotalPages(): number {
    return this.teamPagination.totalPages;
  }

  getTeamDisplayRange(): string {
    if (this.teamPagination.totalItems === 0) return '0';
    if (this.teamPagination.pageSize >= 50) return `1-${this.teamPagination.totalItems}`;

    const start = (this.teamPagination.currentPage - 1) * this.teamPagination.pageSize + 1;
    const end = Math.min(this.teamPagination.currentPage * this.teamPagination.pageSize, this.teamPagination.totalItems);
    return `${start}-${end}`;
  }

  getTeamVisiblePages(): number[] {
    const totalPages = this.teamPagination.totalPages;
    const currentPage = this.teamPagination.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 4) {
        pages.push(-1); // Ellipsis
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) {
        pages.push(-1); // Ellipsis
      }
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages.filter(page => page !== -1);
  }

  goToTeamPage(page: number): void {
    if (page < 1 || page > this.teamPagination.totalPages) return;
    this.teamPagination.currentPage = page;
    this.applyTeamPagination();
  }

  onTeamPageSizeChange(): void {
    this.teamPagination.currentPage = 1; // Reset to first page
    this.applyTeamFiltersAndPagination();
  }

  // Helper Methods
  getAllUserTeams(): Team[] {
    return this.userTeams;
  }

  getPaginatedUserTeams(): Team[] {
    return this.paginatedUserTeams;
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

    // Re-apply filters and pagination to update the view
    this.applyTeamFiltersAndPagination();

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
      this.applyTeamFiltersAndPagination(); // Update the view
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
          this.applyTeamFiltersAndPagination();
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

  getTemplateDisplayName(): string {
    if (this.template?.name && this.template.name.trim() !== '') {
      return this.template.name;
    }

    if (this.template) {
      switch (this.predictionType) {
        case PredictionType.Ranking:
          return `${this.template.numberOfRows}x${this.template.numberOfColumns} Ranking`;
        case PredictionType.Bracket:
          return `${this.template.numberOfRounds} Round Bracket`;
        case PredictionType.Bingo:
          return `${this.template.gridSize}x${this.template.gridSize} Grid`;
      }
    }

    return 'Custom Template';
  }
}
