import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CounterPredictionRequest {
  id: number;
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

  createCounterPrediction(request: CounterPredictionRequest): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/counter-prediction`,
      request
    );
  }

  canUserCounterPredict(predictionId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/can-counter-predict/${predictionId}`
    );
  }

  getUserCounterPrediction(predictionId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/my-prediction/${predictionId}`
    );
  }
}
