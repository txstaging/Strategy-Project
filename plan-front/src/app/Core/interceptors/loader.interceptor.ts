import { HttpInterceptorFn } from '@angular/common/http';
import { inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { LoadingService } from '../Service/loader.service';
import { finalize } from 'rxjs/operators';
import { timer } from 'rxjs';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const injector = inject(EnvironmentInjector);

  // Safely update loading state in proper injection context
  runInInjectionContext(injector, () => {
    loadingService.show();
  });

  return next(req).pipe(
    finalize(() => {
      timer(250).subscribe(() => {
        // Safely update loading state in proper injection context
        runInInjectionContext(injector, () => {
          loadingService.hide();
        });
      });
    })
  );
};
