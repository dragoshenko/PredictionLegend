// client/src/app/create-teams/create-teams.component.ts
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Team } from '../_models/team';
import { TeamService } from '../_services/team.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-teams',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-teams.component.html',
  styleUrls: ['./create-teams.component.css']
})
export class CreateTeamsComponent implements OnInit {
  @Input() template: any;
  teams: Team[] = [];
  teamForm: FormGroup = new FormGroup({});
  isLoading = false;
  errorMessage = '';

  private teamService = inject(TeamService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    this.initializeForm();
    this.loadTeams();
  }

  private initializeForm(): void {
    this.teamForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      description: ['', [Validators.maxLength(500)]],
      photoUrl: ['', [Validators.pattern('https?://.+')]] // Basic URL validation
    });
  }

  private async loadTeams(): Promise<void> {
    try {
      await this.teamService.loadUserTeams();
      this.teams = this.teamService.teams();

      // If template has teams, add them to the list
      if (this.template?.teams?.length) {
        // Merge template teams with user teams, avoiding duplicates
        const existingIds = this.teams.map(t => t.id);
        const templateTeams = this.template.teams.filter((t: Team) => !existingIds.includes(t.id));
        this.teams = [...this.teams, ...templateTeams];
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      this.errorMessage = 'Failed to load teams';
    }
  }

  async addTeam(): Promise<void> {
    if (this.teamForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.error('Please fix the validation errors');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const formValue = this.teamForm.value;

      const teamData = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || null,
        photoUrl: formValue.photoUrl?.trim() || null,
        score: 0
      };

      console.log('Creating team with data:', teamData);

      const newTeam = await this.teamService.createTeam(teamData);

      this.teams.push(newTeam);
      this.teamForm.reset();
      this.toastr.success('Team created successfully!');

    } catch (err: any) {
      console.error('Error creating team:', err);

      let errorMessage = 'Failed to create team';

      if (err?.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error.errors) {
          // Handle validation errors
          const validationErrors = Object.values(err.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      this.errorMessage = errorMessage;
      this.toastr.error(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteTeam(teamId: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await this.teamService.deleteTeam(teamId);
      this.teams = this.teams.filter(t => t.id !== teamId);
      this.toastr.success('Team deleted successfully');
    } catch (err: any) {
      console.error('Error deleting team:', err);

      let errorMessage = 'Failed to delete team';
      if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      this.errorMessage = errorMessage;
      this.toastr.error(errorMessage);
    }
  }

  private markFormGroupTouched(): void {
    Object.values(this.teamForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Getter methods for easy template access to validation states
  get nameControl() { return this.teamForm.get('name'); }
  get descriptionControl() { return this.teamForm.get('description'); }
  get photoUrlControl() { return this.teamForm.get('photoUrl'); }
}
