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

      // Prepare team data with all required fields
      const teamToCreate = {
        name: teamData.name.trim(),
        description: teamData.description?.trim() || null,
        photoUrl: teamData.photoUrl?.trim() || null,
        score: teamData.score || 0,
        createdByUserId: currentUser.id, // This should be set automatically by the API
        createdAt: new Date().toISOString() // This should be set automatically by the API
      };

      console.log('Creating team with data:', teamToCreate);

      const result = await firstValueFrom(
        this.http.post<Team>(`${this.baseUrl}/create`, teamToCreate).pipe(
          tap((newTeam: Team) => {
            this.teams.update(ts => [...ts, newTeam]);
          })
        )
      );
      return result;
    } catch (error) {
      console.error('Failed to create team', error);
      throw error;
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
      const updated = await firstValueFrom(
        this.http.put<Team>(`${this.baseUrl}/update`, team).pipe(
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
