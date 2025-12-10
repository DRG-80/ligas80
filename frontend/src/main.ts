import { bootstrapApplication } from '@angular/platform-browser';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/services/auth.interceptor';

bootstrapApplication(App, {
  providers: [

    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
