import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const currentUser = authService.getCurrentUser();

  if (!token) {
    return router.createUrlTree(['/']);
  }

  if (currentUser) {
    return checkRole(
      currentUser.role,
      route,
      router,
    );
  }

  return authService.loadCurrentUser().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/']);
      }

      return checkRole(
        user.role,
        route,
        router,
      );
    }),
  );
};

function checkRole(
  role: string,
  route: ActivatedRouteSnapshot,
  router: Router,
) {
  const allowedRoles =
    route.data['roles'] as string[] | undefined;

  if (
    !allowedRoles ||
    allowedRoles.includes(role)
  ) {
    return true;
  }

  if (role === 'athlete') {
    return router.createUrlTree(['/athlete']);
  }

  if (role === 'employee') {
    return router.createUrlTree(['/employee']);
  }

  return router.createUrlTree(['/admin']);
}