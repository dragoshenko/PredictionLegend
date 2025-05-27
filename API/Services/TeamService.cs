// client/src/app/_services/team.service.ts - FIXED FRONTEND VERSION
import { Injectable, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Team } from '../_models/team';
import { firstValueFrom, tap, catchError, throwError } from 'rxjs';
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
      this.teams.set(result || []); // FIXED: Handle null/undefined response
      console.log('User teams loaded:', result);
    } catch (error) {
      console.error('Failed to load user teams', error);
      this.teams.set([]); // FIXED: Reset to empty array on error
    }
  }

  /** Get teams for a specific template (filtered locally) */
  getTeamsForTemplate(templateId: number): Team[] {
    return this.teams().filter(t => (t as any).templateId === templateId);
  }

  /** Create a new team with all required fields - FIXED FRONTEND VERSION */
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

      // FIXED: Clean and validate the data properly
      const teamToCreate = {
        name: teamData.name?.trim() || '',
        description: teamData.description?.trim() || '',
        photoUrl: teamData.photoUrl?.trim() || '',
        score: teamData.score || 0
      };

      // FIXED: Client-side validation before sending
      if (!teamToCreate.name || teamToCreate.name.length < 2) {
        throw new Error('Team name must be at least 2 characters long');
      }

      if (teamToCreate.name.length > 100) {
        throw new Error('Team name must be less than 100 characters');
      }

      if (teamToCreate.description && teamToCreate.description.length > 500) {
        throw new Error('Description must be less than 500 characters');
      }

      // FIXED: Check for duplicates in current teams before API call
      const currentTeams = this.teams();
      const duplicateTeam = currentTeams.find(
        team => team.name.toLowerCase().trim() === teamToCreate.name.toLowerCase().trim()
      );

      if (duplicateTeam) {
        throw new Error('You already have a team with this name');
      }

      console.log('Creating team with cleaned data:', teamToCreate);

      // FIXED: Properly handle the HTTP response
      const result = await firstValueFrom(
        this.http.post<Team>(`${this.baseUrl}/create`, teamToCreate).pipe(
          tap((newTeam: Team) => {
            console.log('Team created successfully:', newTeam);
            // FIXED: Update the signal immediately with the new team
            this.teams.update(currentTeams => {
              // Double-check we don't already have this team ID
              if (!currentTeams.find(t => t.id === newTeam.id)) {
                return [...currentTeams, newTeam];
              }
              return currentTeams;
            });
          }),
          catchError((error) => {
            console.error('HTTP Error creating team:', error);
            
            // FIXED: Better error handling and re-throwing
            if (error.status === 400) {
              if (error.error && typeof error.error === 'string') {
                throw new Error(error.error);
              } else if (error.error?.message) {
                throw new Error(error.error.message);
              } else if (error.error?.errors) {
                // Handle model validation errors
                const validationErrors: string[] = [];
                for (const key in error.error.errors) {
                  if (error.error.errors[key]) {
                    validationErrors.push(...error.error.errors[key]);
                  }
                }
                throw new Error(validationErrors.join(', '));
              }
            }
            
            throw new Error('Failed to create team. Please try again.');
          })
        )
      );

      return result;
    } catch (error: any) {
      console.error('Error in createTeam service:', error);
      // FIXED: Re-throw the original error without modification
      throw error;
    }
  }

  /** Delete a team */
  async deleteTeam(teamId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.baseUrl}/${teamId}`).pipe(
          tap(() => {
            // FIXED: Update the signal immediately
            this.teams.update(currentTeams => 
              currentTeams.filter(t => t.id !== teamId)
            );
          }),
          catchError((error) => {
            console.error('HTTP Error deleting team:', error);
            throw new Error('Failed to delete team. Please try again.');
          })
        )
      );
    } catch (error) {
      console.error('Error in deleteTeam service:', error);
      throw error;
    }
  }

  /** Update a team */
  async updateTeam(team: Team): Promise<Team> {
    try {
      const updated = await firstValueFrom(
        this.http.put<Team>(`${this.baseUrl}/update`, team).pipe(
          tap((updatedTeam: Team) => {
            // FIXED: Update the signal immediately
            this.teams.update(currentTeams => 
              currentTeams.map(t => (t.id === updatedTeam.id ? updatedTeam : t))
            );
          }),
          catchError((error) => {
            console.error('HTTP Error updating team:', error);
            throw new Error('Failed to update team. Please try again.');
          })
        )
      );
      return updated;
    } catch (error) {
      console.error('Error in updateTeam service:', error);
      throw error;
    }
  }

  /** Get a specific team by ID */
  async getTeam(teamId: number): Promise<Team> {
    try {
      const team = await firstValueFrom(
        this.http.get<Team>(`${this.baseUrl}/${teamId}`).pipe(
          catchError((error) => {
            console.error('HTTP Error getting team:', error);
            throw new Error('Failed to get team. Please try again.');
          })
        )
      );
      return team;
    } catch (error) {
      console.error('Error in getTeam service:', error);
      throw error;
    }
  }

  /** Check if team name already exists for current user */
  hasTeamWithName(name: string): boolean {
    const currentTeams = this.teams();
    return currentTeams.some(team => 
      team.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
  }

  /** Get team count */
  getTeamCount(): number {
    return this.teams().length;
  }

  /** Clear cache */
  clearCache(): void {
    this.teams.set([]);
  }

  /** Force reload teams from server */
  async reloadTeams(): Promise<void> {
    this.clearCache();
    await this.loadUserTeams();
  }
}