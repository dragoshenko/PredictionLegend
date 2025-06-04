// client/src/app/_services/prediction-results.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublishResultsRequest {
  predictionId: number;
  predictionType: string;
  notes?: string;
  resultsPostRank?: PostRankData | null;
  resultsPostBracket?: PostBracketData | null;
  resultsPostBingo?: PostBingoData | null;
}

export interface PostRankData {
  id: number;
  rankingTemplateId: number;
  predictionId: number;
  userId: number;
  rankTable: RankTableData;
  isOfficialResult: boolean;
  totalScore: number;
  rankTeams: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RankTableData {
  id: number;
  numberOfRows: number;
  numberOfColumns: number;
  rows: RowData[];
}

export interface RowData {
  id: number;
  order: number;
  columns: ColumnData[];
  isWrong: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnData {
  id: number;
  team: TeamData | null;
  teamId: number | null;
  officialScore: number;
  order: number;
}

export interface PostBingoData {
  id: number;
  userId: number;
  gridSize: number;
  bingoCells: BingoCellData[];
  teams: any[];
  totalScore: number;
  isOfficialResult: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BingoCellData {
  id: number;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  bingoId: number;
  row: number;
  column: number;
  team: TeamData | null;
  teamId: number | null;
  officialScore: number;
  isWrong: boolean;
}

export interface PostBracketData {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  // Add other bracket properties as needed
}

export interface TeamData {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  createdByUserId: number;
  createdAt: Date;
}

export interface PredictionResults {
  predictionId: number;
  title: string;
  predictionType: string;
  resultsPublishedAt: Date;
  resultsNotes?: string;
  author: any;
  officialResults?: any;
  officialBracketResults?: any;
  officialBingoResults?: any;
  scoredCounterPredictions: ScoredCounterPrediction[];
  stats: ResultsStats;
}

export interface ScoredCounterPrediction {
  id: number;
  author: any;
  createdAt: Date;
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  rank: number;
  scoredPostRank?: any;
  scoredPostBracket?: any;
  scoredPostBingo?: any;
}

export interface ResultsStats {
  totalCounterPredictions: number;
  totalParticipants: number;
  averageAccuracy: number;
  highestAccuracy: number;
  lowestAccuracy: number;
  bestPrediction?: ScoredCounterPrediction;
  teamAccuracyStats: TeamAccuracyDTO[];
}

export interface TeamAccuracyDTO {
  teamId: number;
  teamName: string;
  correctPredictions: number;
  totalPredictions: number;
  accuracyPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionResultsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'post';

  publishResults(request: PublishResultsRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/publish-results`, request);
  }

  getPredictionResults(predictionId: number): Observable<PredictionResults> {
    return this.http.get<PredictionResults>(`${this.baseUrl}/${predictionId}/results`);
  }

  canPublishResults(predictionId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/${predictionId}/can-publish-results`);
  }

  recalculateScores(predictionId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${predictionId}/calculate-scores`, {});
  }
}
