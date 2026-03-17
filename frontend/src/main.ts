import { bootstrapApplication } from '@angular/platform-browser';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/services/auth.interceptor';

//Iniciar la aplicación
bootstrapApplication(App, {
  providers: [

    // Habilita el cliente HTTP y registra el interceptor de seguridad.
    //El interceptor adjunta automáticamente el token de sesión a las cabeceras de cada petición que se hace hacia Laravel

    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    //Configuración de navegación global de la aplicación
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
