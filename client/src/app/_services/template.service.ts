import { inject, Injectable, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { RankingTemplate } from '../_models/rankingTemplate';
import { BracketTemplate } from '../_models/bracketTemplate';
import { BingoTemplate } from '../_models/bingoTemplate';
import { AccountService } from './account.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class TemplateService implements OnInit {
  private baseUrl = environment.apiUrl + 'template';

  private http = inject(HttpClient);
  private accountService = inject(AccountService);
  private toastr = inject(ToastrService);

  officialRankingTemplates = signal<RankingTemplate[]>([]);
  officialBracketTemplates = signal<BracketTemplate[]>([]);
  officialBingoTemplates = signal<BingoTemplate[]>([]);

  userRankingTemplates = signal<RankingTemplate[]>([]);
  userBracketTemplates = signal<BracketTemplate[]>([]);
  userBingoTemplates = signal<BingoTemplate[]>([]);

  constructor() {}

  ngOnInit(): void {}

  async getOfficialAndUserRankingTemplates(): Promise<void> {
    await Promise.all([
      this.getOfficialRankingTemplates(),
      this.getUserRankingTemplates()
    ]);
  }

  async getOfficialAndUserBracketTemplates(): Promise<void> {
    await Promise.all([
      this.getOfficialBracketTemplates(),
      this.getUserBracketTemplates()
    ]);
  }

  async getOfficialAndUserBingoTemplates(): Promise<void> {
    await Promise.all([
      this.getOfficialBingoTemplates(),
      this.getUserBingoTemplates()
    ]);
  }

  // RANKING TEMPLATES
  async createRankingTemplate(template: RankingTemplate): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<RankingTemplate>(`${this.baseUrl}/ranking`, template)
      );

      this.userRankingTemplates.update(templates => [...templates, response]);
      console.log('Ranking template created successfully');
    } catch (error) {
      console.error('Error creating ranking template:', error);
      throw error;
    }
  }

  getRankingTemplate(id: number) {
    this.http.get<RankingTemplate>(`${this.baseUrl}/ranking/${id}`).pipe(
      tap((template: RankingTemplate) => {
        this.userRankingTemplates.update(templates => [...templates, template]);
      })
    ).subscribe({
      next: (template) => {
        console.log('Ranking template received');
      },
      error: (error) => {
        console.error('Error fetching ranking template:', error);
      }
    });
    return this.userRankingTemplates().find(template => template.id === id);
  }

  async getOfficialRankingTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<RankingTemplate[]>(`${this.baseUrl}/ranking/official`)
      );
      this.officialRankingTemplates.set(templates);
      console.log('Official ranking templates received', templates);
    } catch (error) {
      console.error('Error fetching official ranking templates:', error);
    }
  }

  async getUserRankingTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<RankingTemplate[]>(`${this.baseUrl}/ranking/user`)
      );
      this.userRankingTemplates.set(templates);
      console.log('User ranking templates received', templates);
    } catch (error) {
      console.error('Error fetching user ranking templates:', error);
    }
  }

  // BRACKET TEMPLATES - FIXED IMPLEMENTATION
  async createBracketTemplate(template: BracketTemplate): Promise<void> {
    try {
      console.log('Sending bracket template to server:', template);

      // Create a DTO that matches the backend expectations
      const bracketTemplateDTO = {
        id: 0,
        name: template.name,
        numberOfRounds: template.numberOfRounds,
        numberOfBrackets: Math.pow(2, template.numberOfRounds),
        bracketType: template.bracketType, // This should be the string value
        officialTemplate: false,
        teams: [],
        userId: 0 // Will be set by server
      };

      console.log('Sending DTO:', bracketTemplateDTO);

      const response = await firstValueFrom(
        this.http.post<BracketTemplate>(`${this.baseUrl}/bracket`, bracketTemplateDTO)
      );

      console.log('Bracket template created successfully:', response);
      this.userBracketTemplates.update(templates => [...templates, response]);
    } catch (error) {
      console.error('Error creating bracket template:', error);
      this.toastr.error('Failed to create bracket template');
      throw error;
    }
  }

  async getBracketTemplate(id: number): Promise<BracketTemplate | null> {
    try {
      const template = await firstValueFrom(
        this.http.get<BracketTemplate>(`${this.baseUrl}/bracket/${id}`)
      );

      console.log('Bracket template received:', template);
      return template;
    } catch (error) {
      console.error('Error fetching bracket template:', error);
      this.toastr.error('Failed to fetch bracket template');
      return null;
    }
  }

  async updateBracketTemplate(template: BracketTemplate): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.baseUrl}/bracket/${template.id}`, template)
      );

      this.userBracketTemplates.update(templates =>
        templates.map(t => t.id === template.id ? template : t)
      );

      console.log('Bracket template updated successfully');
      this.toastr.success('Bracket template updated successfully');
    } catch (error) {
      console.error('Error updating bracket template:', error);
      this.toastr.error('Failed to update bracket template');
      throw error;
    }
  }

  async deleteBracketTemplate(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/bracket/${id}`)
      );

      this.userBracketTemplates.update(templates =>
        templates.filter(t => t.id !== id)
      );

      console.log('Bracket template deleted successfully');
      this.toastr.success('Bracket template deleted successfully');
    } catch (error) {
      console.error('Error deleting bracket template:', error);
      this.toastr.error('Failed to delete bracket template');
      throw error;
    }
  }

  async getOfficialBracketTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<BracketTemplate[]>(`${this.baseUrl}/bracket/official`)
      );
      this.officialBracketTemplates.set(templates);
      console.log('Official bracket templates received', templates);
    } catch (error) {
      console.error('Error fetching official bracket templates:', error);
    }
  }

  async getUserBracketTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<BracketTemplate[]>(`${this.baseUrl}/bracket/user`)
      );
      this.userBracketTemplates.set(templates);
      console.log('User bracket templates received', templates);
    } catch (error) {
      console.error('Error fetching user bracket templates:', error);
    }
  }

  // BINGO TEMPLATES
  async createBingoTemplate(template: BingoTemplate): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<BingoTemplate>(`${this.baseUrl}/bingo`, template)
      );

      this.userBingoTemplates.update(templates => [...templates, response]);
      console.log('Bingo template created successfully');
    } catch (error) {
      console.error('Error creating bingo template:', error);
      throw error;
    }
  }

  getBingoTemplate(id: number) {
    this.http.get<BingoTemplate>(`${this.baseUrl}/bingo/${id}`)
      .subscribe({
      next: (template) => {
        this.userBingoTemplates.update(templates => [...templates, template]);
        console.log('Bingo template received');
      },
      error: (error) => {
        console.error('Error fetching bingo template:', error);
      }
    });
  }

  async getOfficialBingoTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<BingoTemplate[]>(`${this.baseUrl}/bingo/official`)
      );
      this.officialBingoTemplates.set(templates);
      console.log('Official bingo templates received', templates);
    } catch (error) {
      console.error('Error fetching official bingo templates:', error);
    }
  }

  async getUserBingoTemplates(): Promise<void> {
    try {
      const templates = await firstValueFrom(
        this.http.get<BingoTemplate[]>(`${this.baseUrl}/bingo/user`)
      );
      this.userBingoTemplates.set(templates);
      console.log('User bingo templates received', templates);
    } catch (error) {
      console.error('Error fetching user bingo templates:', error);
    }
  }
}
