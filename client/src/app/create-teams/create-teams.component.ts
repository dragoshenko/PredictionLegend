import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Team } from '../_models/team';
import { TeamService } from '../_services/team.service';
import { CommonModule } from '@angular/common';

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
  private fb: FormBuilder = new FormBuilder();

  ngOnInit(): void {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: [''],
      photoUrl: ['']
    });

    if (this.template?.teams?.length) {
      this.teams = [...this.template.teams];
    }
  }

  async addTeam(): Promise<void> {
    if (this.teamForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const newTeam = await this.teamService.createTeam({
        ...this.teamForm.value,
        templateId: this.template.id
      });
      this.teams.push(newTeam);
      this.teamForm.reset();
    } catch (err: any) {
      this.errorMessage = err?.error?.message || 'Failed to add team.';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteTeam(teamId: number): Promise<void> {
    try {
      await this.teamService.deleteTeam(teamId);
      this.teams = this.teams.filter(t => t.id !== teamId);
    } catch (err: any) {
      this.errorMessage = err?.error?.message || 'Failed to delete team.';
    }
  }
}
