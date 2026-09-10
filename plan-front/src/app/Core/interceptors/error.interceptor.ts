import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { PermissionDeniedService } from '../Service/permission-denied.service';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);
  const permissionDeniedService = inject(PermissionDeniedService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ';

      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'طلب غير صالح';
          toastr.error(errorMessage, 'خطأ');
          break;
        case 401:
          errorMessage = error.error?.message || 'غير مصرح - يرجي تسجيل الدخول';
          toastr.error(errorMessage, 'خطأ');
          authService.logoutUser();
          break;
        case 403:
          errorMessage = error.error?.message || 'ليس لديك صلاحية للوصول إلى هذا المورد';
          permissionDeniedService.show(errorMessage);
          break;
        case 404:
          errorMessage = error.error?.message || 'المورد غير موجود';
          toastr.error(errorMessage, 'خطأ');
          break;
        case 500:
          errorMessage = error.error?.message || 'خطأ في الخادم الداخلي';
          toastr.error(errorMessage, 'خطأ');
          break;
        default:
          errorMessage = error.error?.message || 'حدث خطأ ما';
          toastr.error(errorMessage, 'خطأ');
      }

      return throwError(() => error);
    })
  );
};
