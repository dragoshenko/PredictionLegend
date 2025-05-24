import { inject, Injectable, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { RankingTemplate } from '../_models/rankingTemplate';
import { BracketTemplate } from '../_models/bracketTemplate';
import { BingoTemplate } from '../_models/bingoTemplate';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService implements OnInit {
  private baseUrl = environment.apiUrl + 'template';

  private http = inject(HttpClient);
  accountService = inject(AccountService);

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

  createRankingTemplate(template: RankingTemplate) {
    this.http.post<RankingTemplate>(`${this.baseUrl}/ranking`, template).pipe(
      tap((newTemplate: RankingTemplate) => {
        this.userRankingTemplates.update(templates => [...templates, newTemplate]);
      })
    ).subscribe({
      next: (newTemplate) => {
        console.log('Ranking template created');
      },
      error: (error) => {
        console.error('Error creating ranking template:', error);
      }
    });
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

  createBracketTemplate(template: BracketTemplate) {
    this.http.post<BracketTemplate>(`${this.baseUrl}/bracket`, template).subscribe({
      next: (newTemplate) => {
        this.userBracketTemplates.update(templates => [...templates, newTemplate]);
        console.log('Bracket template created');
      },
      error: (error) => {
        console.error('Error creating bracket template:', error);
      }
    });
  }

  getBracketTemplate(id: number) {
    this.http.get<BracketTemplate>(`${this.baseUrl}/bracket/${id}`).subscribe({
      next: (template) => {
        this.userBracketTemplates.update(templates => [...templates, template]);
        console.log('Bracket template received');
      },
      error: (error) => {
        console.error('Error fetching bracket template:', error);
      }
    });
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

  createBingoTemplate(template: BingoTemplate) {
    this.http.post<BingoTemplate>(`${this.baseUrl}/bingo`, template).subscribe({
      next: (newTemplate) => {
        this.userBingoTemplates.update(templates => [...templates, newTemplate]);
        console.log('Bingo template created');
      },
      error: (error) => {
        console.error('Error creating bingo template:', error);
      }
    });
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