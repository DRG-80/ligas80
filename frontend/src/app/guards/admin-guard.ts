import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';
import { map, catchError, of } from 'rxjs';


// Necesario para proteger las rutas exlcusivas para los administradores
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Se comprueba si el Signal 'usuarioActual' ya tiene datos, esto ahorra peticiones HTTP innecesarias si el usuario ya lleva un rato navegando.
  if (auth.usuarioActual()) {
    //Es admin
    if (auth.tieneIdNegativo()) {
      return true;
      //No es admin
    } else {
      router.navigate(['/']);
      return false;
    }
  }

  //Consulta al servidor
  return auth.user().pipe(
    // Se transforma (map) la respuesta del servidor en un valor Booleano para el Guard
    map((user: any) => {
      if (user && auth.tieneIdNegativo()) {
        return true;
      }
      // Si el servidor dice que es válido pero no es administrador:
      router.navigate(['/']);
      return false;
    }),
    // Si la petición del servidor falla
    catchError(() => {

      router.navigate(['/login']);
      return of(false);
    })
  );
};
