import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CounterPredictionRequest {
  notes?: string;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CounterPredictionService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'post';

  createCounterPrediction(originalPredictionId: number, request: CounterPredictionRequest): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/${originalPredictionId}/counter-predict`,
      request
    );
  }

  canUserCounterPredict(predictionId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/${predictionId}/can-counter-predict`
    );
  }

  getUserCounterPrediction(predictionId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/${predictionId}/my-counter-prediction`
    );
  }
}
