import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PermissionDeniedService {
  isVisible = signal(false);
  message = signal('ليس لديك صلاحية للوصول إلى هذا المورد');

  show(message?: string): void {
    if (message) {
      this.message.set(message);
    }
    this.isVisible.set(true);
  }

  hide(): void {
    this.isVisible.set(false);
  }
}
