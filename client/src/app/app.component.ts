import { Component, inject, NgModule, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav/nav.component';
import { NgxSpinnerComponent} from 'ngx-spinner';
import { BusyService } from './_services/busy.service';
import { delay } from 'rxjs';
import { GoogleApiService } from './_services/google-api.service';
import {NgcCookieConsentModule, NgcCookieConsentConfig} from 'ngx-cookieconsent';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent, NgxSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'client';
  busy = inject(BusyService);
  google = inject(GoogleApiService);

  ngOnInit(): void {

  }

  loginGoogle(): void {
    this.google.configure();
  }

  logOutGoogle(): void {
    this.google.logOut();
  }

  loadSpinner() {
    this.busy.busy();
    delay(1000);
    //this.busy.idle();
    //return Promise.resolve();
  }

}
