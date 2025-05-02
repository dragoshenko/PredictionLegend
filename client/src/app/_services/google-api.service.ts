import { inject, Injectable, signal } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

const oAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false, // not the case for google
  redirectUri: window.location.origin,
  clientId: '851814011332-ms64nqi5l5uqqk1rmord8um053fmf8u8.apps.googleusercontent.com',
  scope: 'openid profile email',
}

export interface UserProfile{
  info : {
    sub: string,
    name: string,
    email: string,
    picture: string
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {

  private readonly oAuthService = inject(OAuthService);
  userProfile = signal<UserProfile | null>(null);

  configure(): void {
    this.oAuthService.configure(oAuthConfig);
    this.oAuthService.loadDiscoveryDocument().then(() => {
      this.oAuthService.tryLoginImplicitFlow().then(()=>{
        if(this.oAuthService.hasValidAccessToken() === false){
          this.oAuthService.initLoginFlow();
        }
        else
        {
          this.oAuthService.loadUserProfile().then((userProfile)=>{
            this.userProfile.set(userProfile as UserProfile);
          });
          const idToken = this.oAuthService.getIdToken();
          console.log('idToken', idToken);
        }
      });
    });
  }

  logOut(): void {
    this.oAuthService.logOut();
  }

}
