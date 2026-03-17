import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Optimiza el rendimiento de Angular agrupando eventos (event coalescing)
    // para no redibujar la pantalla innecesariamente en cada pequeño cambio
    provideZoneChangeDetection({ eventCoalescing: true }),
    //Inyecta las rutas
    provideRouter(routes),
    //Habilita las peticiones y añade el interceptor para el token necesario de Laravel
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
