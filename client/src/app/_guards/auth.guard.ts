import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';

export const AuthGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const toastr = inject(ToastrService);

  const user = accountService.currentUser(); // <-- call the signal as a function

  if (user) return true;

  toastr.error('You need to be logged in to access this area');
  return false;
};
