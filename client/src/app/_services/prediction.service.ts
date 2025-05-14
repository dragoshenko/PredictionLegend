import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'prediction';

  // Get user's predictions
  getUserPredictions(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // Get public predictions
  getPublicPredictions(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/public');
  }

  // Get a prediction by ID
  getPredictionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // Create a new prediction
  createPrediction(predictionData: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, predictionData);
  }

  // Update an existing prediction
  updatePrediction(id: number, predictionData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, predictionData);
  }

  // Delete a prediction
  deletePrediction(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  // Publish a prediction
  publishPrediction(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/publish`, {});
  }
}
