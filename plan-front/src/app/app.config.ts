import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { apiInterceptor } from './Core/interceptors/api.interceptor';
import { authInterceptor } from './Core/interceptors/auth.interceptor';
import { errorHandlerInterceptor } from './Core/interceptors/error.interceptor';
import { loaderInterceptor } from './Core/interceptors/loader.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'disabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideClientHydration(),
    provideHttpClient(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        apiInterceptor,
        loaderInterceptor,
        errorHandlerInterceptor,
      ])
    ),
    provideAnimations(),
    provideToastr({
      timeOut: 90000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true
    }),
  ],
};
