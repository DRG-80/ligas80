import { HttpInterceptorFn } from '@angular/common/http';

//Atrapa todas las peticiones y le añade las cabeceras y tokens
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // Configuración de cabeceras
  let newHeaders = req.headers
    .set('Accept', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest');

  // Busca la cookie de seguridad que Laravel genera automáticamente.
  const token = getCookie('XSRF-TOKEN');

  // Si existe se inyecta a la cabecera
  if (token) {
    newHeaders = newHeaders.set('X-XSRF-TOKEN', decodeURIComponent(token));
  }

  // Clonación de la petición con las nuevas cabeceras
  const cloned = req.clone({
    headers: newHeaders
  });

  return next(cloned);
};




  // Lee las cookies del navegador (document.cookie), las separa y busca
  // específicamente el valor de la cookie cuyo nombre se pasa por parámetro.

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
