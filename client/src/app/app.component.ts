import { Component, inject, NgModule, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav/nav.component';
import { NgxSpinnerComponent} from 'ngx-spinner';
import { BusyService } from './_services/busy.service';
import { delay } from 'rxjs';
import { GoogleApiService } from './_services/google-api.service';
import { GlobalFooterComponent } from './global-footer/global-footer.component';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent, NgxSpinnerComponent, GlobalFooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'client';
  busy = inject(BusyService);
  googleService = inject(GoogleApiService);
  cookieService = inject(CookieService);

  ngOnInit(): void {
    if(this.cookieService.check('id_token') === false) {
      this.googleService.configure();
      this.googleService.handleLoginRedirect();
    }
    else
    {
      this.googleService.idToken.set(this.cookieService.get('id_token'));
    }
  }

  loginGoogle(): void {
    this.googleService.configure();
  }

  logOutGoogle(): void {
    this.googleService.logOut();
  }

  loadSpinner() {
    this.busy.busy();
    delay(200);
  }
}
