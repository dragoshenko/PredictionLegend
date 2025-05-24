import { HttpInterceptorFn } from '@angular/common/http';
import { AccountService } from '../_services/account.service';
import { inject } from '@angular/core';
// this is a centralized way of sending the auth token to the server
// just have this in one place
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const accountService = inject(AccountService);

  if(accountService.currentUser())
  {
    req = req.clone({ // need to clone as req is immutable
      setHeaders: {
        Authorization: `Bearer ${accountService.currentUser()?.token}`
      }
    });
  }
  return next(req);
};
