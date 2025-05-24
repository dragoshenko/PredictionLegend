import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnInit, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Prediction } from '../_models/prediction';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class PredictionService implements OnInit {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  createdPredictionData = signal<Prediction | null>(null);

  ngOnInit(): void {

  }

  getPredictions() {
  }

  createPrediction(prediction: Prediction)
  {
    return this.http.post<Prediction>(this.baseUrl + 'prediction/create', prediction);
  }

  getPrediction(id: number) {
    return this.http.get<Prediction>(this.baseUrl + 'prediction/' + id);
  }

  updatePrediction(prediction: Prediction) {
    return this.http.put<Prediction>(this.baseUrl + 'prediction/update', prediction);
  }
}
