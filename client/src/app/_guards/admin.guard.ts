// client/src/app/_guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';

export const AdminGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const toastr = inject(ToastrService);
  const router = inject(Router);

  return accountService.currentUser$.pipe(
    map(user => {
      if (!user) {
        toastr.error('You must be logged in to access this area');
        router.navigateByUrl('/auth');
        return false;
      }

      if (user.roles && user.roles.includes('Admin')) {
        return true;
      }

      toastr.error('You do not have permission to access this area');
      router.navigateByUrl('/');
      return false;
    })
  );
};
