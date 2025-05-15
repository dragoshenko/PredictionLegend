// _services/google-api.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

const oAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin,
  clientId: environment.clientId,
  scope: 'openid profile email'
}

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {
  private readonly oAuthService = inject(OAuthService);
  idToken = signal<string | null>(null);
  private _isAuthReady = signal(false);
  isAuthReady = this._isAuthReady.asReadonly();
  constructor() {
    this.oAuthService.configure(oAuthConfig);
  }

  configure(): void {
    this.oAuthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oAuthService.hasValidAccessToken()) {
        const token = this.oAuthService.getIdToken();
        this.idToken.set(token);
      }
      this._isAuthReady.set(true);
    });
  }

  handleLoginRedirect(): void {
    this.oAuthService.loadDiscoveryDocument().then(() => {
      this.oAuthService.tryLoginImplicitFlow().then(() => {
        if (this.oAuthService.hasValidAccessToken()) {
          const token = this.oAuthService.getIdToken();
          this.idToken.set(token);
        }
      });
    });
  }



  oAuthDiscovery(): void {
    this.oAuthService.loadDiscoveryDocumentAndLogin().then(() => {
      this.oAuthService.initLoginFlow();
    });
  }

  logOut(): void {
    this.oAuthService.logOut();
  }
}
