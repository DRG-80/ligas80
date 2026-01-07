import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.usuarioActual()) {
    if (auth.tieneIdNegativo()) {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  }

  return auth.user().pipe(
    map((user: any) => {
      if (user && auth.tieneIdNegativo()) {
        return true;
      }

      router.navigate(['/']);
      return false;
    }),
    catchError(() => {

      router.navigate(['/login']);
      return of(false);
    })
  );
};
