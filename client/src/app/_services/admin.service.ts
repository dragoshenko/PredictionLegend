// client/src/app/_services/admin.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AdminUser, AdminUserDetail } from '../_models/admin-user';
import { SystemInfo } from '../_models/system-info';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUsers() {
    return this.http.get<AdminUser[]>(this.baseUrl + 'admin/users');
  }

  getUserDetails(id: number) {
    return this.http.get<AdminUserDetail>(this.baseUrl + 'admin/user/' + id);
  }

  updateUserRoles(username: string, roles: string[]) {
    return this.http.post<string[]>(this.baseUrl + 'admin/edit-roles/' + username, {}, {
      params: { roles: roles.join(',') }
    });
  }

  deleteUser(id: number) {
    return this.http.delete(this.baseUrl + 'admin/user/' + id);
  }

  getSystemInfo() {
    return this.http.get<SystemInfo>(this.baseUrl + 'admin/system-info');
  }
}
