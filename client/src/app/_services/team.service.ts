// client/src/app/_services/team.service.ts
import { Injectable, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Team } from '../_models/team';
import { firstValueFrom, tap } from 'rxjs';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class TeamService implements OnInit {
  private baseUrl = environment.apiUrl + 'team';
  private http = inject(HttpClient);
  private accountService = inject(AccountService);

  teams = signal<Team[]>([]);

  constructor() {}

  ngOnInit(): void {}

  async loadUserTeams(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.http.get<Team[]>(`${this.baseUrl}/user`)
      );
      this.teams.set(result);
      console.log('User teams loaded:', result);
    } catch (error) {
      console.error('Failed to load user teams', error);
    }
  }

  /** Get teams for a specific template (filtered locally) */
  getTeamsForTemplate(templateId: number): Team[] {
    return this.teams().filter(t => (t as any).templateId === templateId);
  }

  /** Create a new team with all required fields */
  async createTeam(teamData: {
    name: string;
    description?: string;
    photoUrl?: string;
    templateId?: number;
    score?: number;
  }): Promise<Team> {
    try {
      const currentUser = this.accountService.currentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!teamData.name || teamData.name.trim().length === 0) {
        throw new Error('Team name is required');
      }

      if (teamData.name.trim().length < 2 || teamData.name.trim().length > 100) {
        throw new Error('Team name must be between 2 and 100 characters');
      }

      // Prepare team data with all required fields according to the DTO and Entity
      const teamToCreate = {
        id: 0, // This will be set by the server
        name: teamData.name.trim(),
        description: teamData.description?.trim() || '',
        photoUrl: teamData.photoUrl?.trim() || '',
        score: teamData.score || 0,
        createdByUserId: currentUser.id,
        createdAt: new Date() // This should be set automatically by the API but we include it for completeness
      };

      console.log('Creating team with data:', teamToCreate);

      const result = await firstValueFrom(
        this.http.post<Team>(`${this.baseUrl}/create`, teamToCreate).pipe(
          tap((newTeam: Team) => {
            // Update local teams signal
            this.teams.update(ts => [...ts, newTeam]);
            console.log('Team created successfully:', newTeam);
          })
        )
      );
      return result;
    } catch (error: any) {
      console.error('Failed to create team:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to create team';

      if (error?.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.errors) {
          // Handle ASP.NET Core validation errors
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /** Delete a team */
  async deleteTeam(teamId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.baseUrl}/${teamId}`).pipe(
          tap(() => {
            this.teams.update(ts => ts.filter(t => t.id !== teamId));
          })
        )
      );
    } catch (error) {
      console.error('Failed to delete team', error);
      throw error;
    }
  }

  /** Update a team */
  async updateTeam(team: Team): Promise<Team> {
    try {
      // Validate the team data before sending
      if (!team.name || team.name.trim().length === 0) {
        throw new Error('Team name is required');
      }

      if (team.name.trim().length < 2 || team.name.trim().length > 100) {
        throw new Error('Team name must be between 2 and 100 characters');
      }

      const teamToUpdate = {
        id: team.id,
        name: team.name.trim(),
        description: team.description?.trim() || '',
        photoUrl: team.photoUrl?.trim() || '',
        score: team.score || 0,
        createdByUserId: team.createdByUserId,
        createdAt: team.createdAt
      };

      const updated = await firstValueFrom(
        this.http.put<Team>(`${this.baseUrl}/update`, teamToUpdate).pipe(
          tap((updatedTeam: Team) => {
            this.teams.update(ts => ts.map(t => (t.id === updatedTeam.id ? updatedTeam : t)));
          })
        )
      );
      return updated;
    } catch (error) {
      console.error('Failed to update team', error);
      throw error;
    }
  }

  /** Clear cache */
  clearCache(): void {
    this.teams.set([]);
  }
}
