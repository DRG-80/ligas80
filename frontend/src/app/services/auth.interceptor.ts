import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // 1. Configuramos los headers OBLIGATORIOS para que Laravel no redirija
  let newHeaders = req.headers
    .set('Accept', 'application/json')
    // 👇 ESTA ES LA CLAVE NUEVA:
    .set('X-Requested-With', 'XMLHttpRequest');

  // 2. Buscamos el token XSRF
  const token = getCookie('XSRF-TOKEN');

  // 3. Si existe, lo pegamos
  if (token) {
    newHeaders = newHeaders.set('X-XSRF-TOKEN', decodeURIComponent(token));
  }

  // 4. Clonamos y enviamos
  const cloned = req.clone({
    headers: newHeaders
  });

  return next(cloned);
};

// Función auxiliar sin cambios...
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
