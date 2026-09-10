# Frontend Permissions Guide - نظام الصلاحيات

## 1. Login Response - استجابة تسجيل الدخول

When the user logs in via `POST /api/Account/login`, the response includes a `Permissions` object:

```json
{
  "message": "Success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "planId": 5,
    "permissions": {
      "Plans": ["GetAll", "GetOne", "Add", "Update", "Delete"],
      "Goals": ["GetAll", "GetOne", "Add", "Update"],
      "Analysis": ["GetAll", "Add", "Update", "Approve"],
      "Reports": ["GetAll", "GetOne"],
      "Projects": ["GetAll", "GetOne", "Add", "Update", "Delete", "Approve", "Reject", "Return"],
      "Initiative": ["GetAll", "GetOne", "Add"],
      "Direction": ["GetAll", "GetOne", "Add", "Update"]
    }
  }
}
```

The same `permissions` object is also returned from:
- `GET /api/Account/me` (inside `data.permissions`)
- `GET /api/Account/UserPermessions/{userId}` (inside `permissions`)

---

## 2. Modules & Permissions - الوحدات والصلاحيات

### Modules (الوحدات):
| Module | الوحدة |
|--------|--------|
| `Plans` | الخطط |
| `Goals` | الأهداف |
| `Analysis` | التحليل |
| `Reports` | التقارير |
| `Projects` | المشاريع |
| `Initiative` | المبادرات |
| `Direction` | التوجه الاستراتيجي |

### Permissions (الصلاحيات):
| Permission | الصلاحية | الاستخدام |
|------------|----------|-----------|
| `GetAll` | عرض الكل | قوائم وجداول |
| `GetOne` | عرض واحد | تفاصيل عنصر |
| `Add` | إضافة | إنشاء عنصر جديد |
| `Update` | تعديل | تحديث عنصر موجود |
| `Delete` | حذف | حذف عنصر |
| `Approve` | موافقة | اعتماد/قبول |
| `Reject` | رفض | رفض عنصر |
| `Return` | إرجاع | إعادة للمراجعة |

---

## 3. API Endpoints & Required Permissions - نقاط الوصول والصلاحيات المطلوبة

### Plans - الخطط (`/api/Plan`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Plan` | `Plans.GetAll` | عرض جميع الخطط |
| GET | `/api/Plan/{id}` | `Plans.GetOne` | عرض خطة واحدة |
| POST | `/api/Plan` | `Plans.Add` | إضافة خطة جديدة |
| POST | `/api/Plan/Update` | `Plans.Update` | تحديث خطة |
| DELETE | `/api/Plan/{id}` | `Plans.Delete` | حذف خطة |
| POST | `/api/PlanStatus/Approve` | `Plans.Approve` | اعتماد خطة |
| POST | `/api/PlanStatus/Reject` | `Plans.Reject` | رفض خطة |
| POST | `/api/PlanStatus/Return` | `Plans.Return` | إرجاع خطة |

### Analysis - التحليل (`/api/AnalysisPoints`, `/api/PlanAnalysis`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/AnalysisPoints` | `Analysis.GetAll` | عرض نقاط التحليل |
| GET | `/api/AnalysisPoints/{id}` | `Analysis.GetOne` | عرض نقطة تحليل |
| POST | `/api/AnalysisPoints` | `Analysis.Add` | إضافة نقطة تحليل |
| PUT | `/api/AnalysisPoints` | `Analysis.Update` | تحديث نقطة تحليل |
| DELETE | `/api/AnalysisPoints/{id}` | `Analysis.Delete` | حذف نقطة تحليل |
| POST | `/api/PlanAnalysis/Approve` | `Analysis.Approve` | اعتماد التحليل |
| POST | `/api/PlanAnalysis/Reject` | `Analysis.Reject` | رفض التحليل |
| POST | `/api/PlanAnalysis/Return` | `Analysis.Return` | إرجاع التحليل |

### Goals - الأهداف (`/api/Goals`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Goals` | `Goals.GetAll` | عرض جميع الأهداف |
| GET | `/api/Goals/{id}` | `Goals.GetOne` | عرض هدف واحد |
| POST | `/api/Goals` | `Goals.Add` | إضافة هدف |
| PUT | `/api/Goals` | `Goals.Update` | تحديث هدف |
| DELETE | `/api/Goals/{id}` | `Goals.Delete` | حذف هدف |
| POST | `/api/Goals/Approve` | `Goals.Approve` | اعتماد هدف |
| POST | `/api/Goals/Reject` | `Goals.Reject` | رفض هدف |
| POST | `/api/Goals/Return` | `Goals.Return` | إرجاع هدف |

### Initiative - المبادرات (`/api/Initiatives`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Initiatives` | `Initiative.GetAll` | عرض جميع المبادرات |
| GET | `/api/Initiatives/{id}` | `Initiative.GetOne` | عرض مبادرة واحدة |
| POST | `/api/Initiatives` | `Initiative.Add` | إضافة مبادرة |
| PUT | `/api/Initiatives` | `Initiative.Update` | تحديث مبادرة |
| DELETE | `/api/Initiatives/{id}` | `Initiative.Delete` | حذف مبادرة |
| POST | `/api/Initiatives/Approve` | `Initiative.Approve` | اعتماد مبادرة |
| POST | `/api/Initiatives/Reject` | `Initiative.Reject` | رفض مبادرة |
| POST | `/api/Initiatives/Return` | `Initiative.Return` | إرجاع مبادرة |

### Projects - المشاريع (`/api/Project`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Project` | `Projects.GetAll` | عرض جميع المشاريع |
| GET | `/api/Project/{id}` | `Projects.GetOne` | عرض مشروع واحد |
| POST | `/api/Project` | `Projects.Add` | إضافة مشروع |
| PUT | `/api/Project` | `Projects.Update` | تحديث مشروع |
| DELETE | `/api/Project/{id}` | `Projects.Delete` | حذف مشروع |
| POST | `/api/Project/Approve` | `Projects.Approve` | اعتماد مشروع |
| POST | `/api/Project/Reject` | `Projects.Reject` | رفض مشروع |
| POST | `/api/Project/Return` | `Projects.Return` | إرجاع مشروع |

### Direction - التوجه الاستراتيجي (`/api/DirectionItems`, `/api/DirectionItemsElements`, `/api/PlanDirection`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/DirectionItems` | `Direction.GetAll` | عرض عناصر التوجه |
| GET | `/api/DirectionItems/{id}` | `Direction.GetOne` | عرض عنصر واحد |
| POST | `/api/DirectionItems` | `Direction.Add` | إضافة عنصر توجه |
| PUT | `/api/DirectionItems` | `Direction.Update` | تحديث عنصر توجه |
| DELETE | `/api/DirectionItems/{id}` | `Direction.Delete` | حذف عنصر توجه |
| POST | `/api/PlanDirection/Approve` | `Direction.Approve` | اعتماد التوجه |
| POST | `/api/PlanDirection/Reject` | `Direction.Reject` | رفض التوجه |
| POST | `/api/PlanDirection/Return` | `Direction.Return` | إرجاع التوجه |

### Reports - التقارير (`/api/Reports`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Reports` | `Reports.GetAll` | عرض جميع التقارير |
| GET | `/api/Reports/{id}` | `Reports.GetOne` | عرض تقرير واحد |

### Units - الوحدات (`/api/Units`)
| Method | Endpoint | Permission | الوصف |
|--------|----------|------------|-------|
| GET | `/api/Units` | `Plans.GetAll` | عرض وحدات المستخدم |
| GET | `/api/Units/All` | `Plans.GetAll` | عرض جميع الوحدات |
| GET | `/api/Units/{id}` | `Plans.GetOne` | عرض وحدة واحدة |
| POST | `/api/Units` | `Plans.Add` | إضافة وحدة |
| POST | `/api/Units/UpdateUnit` | `Plans.Update` | تحديث وحدة |
| DELETE | `/api/Units/{id}` | `Plans.Delete` | حذف وحدة |

---

## 4. Error Response When Permission Denied - استجابة عدم الصلاحية

When a user tries to access an API they don't have permission for, the server returns:

```
HTTP 403 Forbidden
```

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.4",
  "title": "Forbidden",
  "status": 403
}
```

If the user is not logged in at all (no token or expired token):

```
HTTP 401 Unauthorized
```

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.2",
  "title": "Unauthorized",
  "status": 401
}
```

---

## 5. Frontend Implementation Guide - دليل التطبيق للواجهة

### Step 1: Store permissions after login

```typescript
// After login, store the permissions from the response
const loginResponse = await login(email, password);
const permissions = loginResponse.data.permissions;
localStorage.setItem('permissions', JSON.stringify(permissions));
localStorage.setItem('token', loginResponse.data.token);
```

### Step 2: Create a permission check helper

```typescript
// permissions.helper.ts
export function hasPermission(module: string, permission: string): boolean {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  return permissions[module]?.includes(permission) ?? false;
}

// Usage examples:
hasPermission('Plans', 'GetAll')    // Can view plans list?
hasPermission('Plans', 'Add')       // Can create plans?
hasPermission('Plans', 'Approve')   // Can approve plans?
hasPermission('Projects', 'Delete') // Can delete projects?
```

### Step 3: Hide/show UI elements based on permissions

```html
<!-- Angular example -->
<button *ngIf="hasPermission('Plans', 'Add')" (click)="addPlan()">
  إضافة خطة جديدة
</button>

<button *ngIf="hasPermission('Plans', 'Approve')" (click)="approve()">
  اعتما��
</button>

<button *ngIf="hasPermission('Plans', 'Reject')" (click)="reject()">
  رفض
</button>

<button *ngIf="hasPermission('Plans', 'Delete')" (click)="delete()">
  حذف
</button>

<!-- Hide entire page/section if no view permission -->
<div *ngIf="hasPermission('Reports', 'GetAll')">
  <!-- Reports content -->
</div>
```

### Step 4: Create an Angular Guard (Route Protection)

```typescript
// permission.guard.ts
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const module = route.data['module'];
    const permission = route.data['permission'];
    return hasPermission(module, permission);
  }
}

// app-routing.module.ts
{
  path: 'plans',
  component: PlansComponent,
  canActivate: [PermissionGuard],
  data: { module: 'Plans', permission: 'GetAll' }
},
{
  path: 'plans/add',
  component: AddPlanComponent,
  canActivate: [PermissionGuard],
  data: { module: 'Plans', permission: 'Add' }
}
```

### Step 5: Handle 403 errors globally

```typescript
// http-interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or not logged in → redirect to login
        this.router.navigate(['/login']);
      }
      if (error.status === 403) {
        // No permission → show error message
        alert('ليس لديك صلاحية للوصول إلى هذا المورد');
        // Or use a toast/snackbar notification
      }
      return throwError(() => error);
    })
  );
}
```

---

## 6. Get Available Modules & Permissions - الحصول على الوحدات والصلاحيات المتاحة

To get the list of all available modules and permissions (useful for admin panel when assigning permissions):

```
GET /api/Account/Permissions
```

Response:
```json
{
  "modules": ["Plans", "Goals", "Analysis", "Reports", "Projects", "Initiative", "Direction"],
  "permissions": ["Approve", "Reject", "Return", "Add", "Update", "Delete", "GetAll", "GetOne"]
}
```

---

## 7. Register User with Permissions - تسجيل مستخدم مع صلاحيات

```
POST /api/Account/register/v2
```

```json
{
  "userName": "محمد أحمد",
  "email": "user@mod.com",
  "password": "123456",
  "unitId": 1,
  "role": "UnitManager",
  "modulePermissions": {
    "Plans": ["GetAll", "GetOne", "Add", "Update"],
    "Goals": ["GetAll", "GetOne", "Add", "Update", "Delete"],
    "Analysis": ["GetAll", "GetOne", "Add"],
    "Projects": ["GetAll", "GetOne"],
    "Initiative": ["GetAll", "GetOne"],
    "Direction": ["GetAll", "GetOne"],
    "Reports": ["GetAll", "GetOne"]
  }
}
```

---

## 8. Update User Permissions - تحديث صلاحيات المستخدم

```
POST /api/Account/update-permissions/{userId}
```

```json
{
  "userId": 5,
  "role": "UnitManager",
  "modulePermissions": {
    "Plans": ["GetAll", "GetOne", "Add", "Update", "Delete", "Approve"],
    "Goals": ["GetAll", "GetOne", "Add"]
  }
}
```

---

## 9. Summary Table - جدول ملخص

| HTTP Status | المعنى | السبب |
|-------------|--------|-------|
| `200` | نجاح | العملية تمت بنجاح |
| `401` | غير مصرح | لم يتم تسجيل الدخول أو انتهت صلاحية التوكن |
| `403` | ممنوع | المستخدم لا يملك الصلاحية المطلوبة |
| `400` | خطأ في الطلب | بيانات غير صحيحة |
| `404` | غير موجود | العنصر المطلوب غير موجود |
