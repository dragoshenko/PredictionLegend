import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { AccountService } from '../_services/account.service';
import { take } from 'rxjs';
import { RouterModule } from '@angular/router'; // ✅ FIXED

@Component({
  selector: 'app-password-change-warning',
  templateUrl: './password-change-warning.component.html',
  styleUrls: ['./password-change-warning.component.css'],
  imports: [RouterModule],
  standalone: true
})
export class PasswordChangeWarningComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private accountService = inject(AccountService);

  ngOnInit(): void {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user && user.wasWarnedAboutPasswordChange === false) {
        console.log('User was warned about password change');

        const headers = new HttpHeaders({
          Authorization: `Bearer ${user.token}`,
        });

        this.http.put(`${this.baseUrl}account/was-warned-about-password-change`, {}, { responseType: 'text', headers }).subscribe({
          next: () => {
            console.log('Password change warning acknowledged');
          },
          error: error => {
            console.error('Error acknowledging password change warning', error);
          }
        });

        user.wasWarnedAboutPasswordChange = true;
        this.accountService.setCurrentUser(user, true);
      }
    });
  }
}
