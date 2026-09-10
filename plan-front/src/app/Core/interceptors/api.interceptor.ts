import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';       
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // استثناء الطلبات التي تذهب إلى `jawda-backend.rawaqtech.com`
  if (req.url.includes('jawda-backend.rawaqtech.com')) {
    return next(req); // لا تقم بإضافة `BACKEND_URL` لهذا الطلب
  }

  // أضف `BACKEND_URL` لبقية الطلبات
  const apiReq = req.clone({
    url: `${environment.BACKEND_URL}${req.url}`,
  });

  return next(apiReq);
};
