import { bootstrapApplication } from '@angular/platform-browser';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { App } from './app/app';
// 1. IMPORTANTE: Importar withInterceptors
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
// 2. IMPORTANTE: Importar tu interceptor (asegúrate que la ruta sea correcta)
import { authInterceptor } from './app/services/auth.interceptor';

bootstrapApplication(App, {
  providers: [
    // 3. AQUÍ ESTÁ EL CAMBIO CLAVE:
    provideHttpClient(
      withInterceptors([authInterceptor]) // <--- Activamos el interceptor
    ),
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
