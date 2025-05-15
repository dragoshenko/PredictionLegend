import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { GoogleApiService } from '../_services/google-api.service';
import { AccountService } from '../_services/account.service';
import { combineLatest, filter, map, switchMap, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const GoogleGuard: CanActivateFn = (route, state) => {
  const googleService = inject(GoogleApiService);
  const accountService = inject(AccountService);

  const isAuthReady$ = toObservable(googleService.isAuthReady);
  const idToken$ = toObservable(googleService.idToken);
  const currentUser$ = accountService.currentUser$;

  return isAuthReady$.pipe(
    filter(ready => ready), // wait until auth process is done
    take(1),
    switchMap(() =>
      combineLatest([idToken$, currentUser$]).pipe(
        filter(([idToken, currentUser]) => !!idToken && !!currentUser),
        take(1),
        map(() => true)
      )
    )
  );
};
