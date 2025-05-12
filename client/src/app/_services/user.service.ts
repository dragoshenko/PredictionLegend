import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  updateProfile(model: any): Observable<any> {
    console.log('Sending update to server:', model);
    return this.http.put(this.baseUrl + 'user', model);
  }

  requestPasswordChange(model: any): Observable<any> {
    return this.http.post(this.baseUrl + 'user/change-password-request', model);
  }

  verifyPasswordChange(model: any): Observable<any> {
    return this.http.post(this.baseUrl + 'user/verify-password-change', model);
  }

  getUserStats(): Observable<any> {
    return this.http.get(this.baseUrl + 'user/stats');
  }
}
