import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionDeniedService } from '../../../Core/Service/permission-denied.service';

@Component({
  selector: 'app-permission-denied-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (permissionDeniedService.isVisible()) {
      <div
        class="modal show d-block"
        tabindex="-1"
        style="background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px); z-index: 9999;"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="bi bi-shield-exclamation me-2"></i>
                غير مصرح
              </h5>
            </div>
            <div class="modal-body text-center py-4">
              <i class="bi bi-lock-fill text-danger" style="font-size: 3rem;"></i>
              <h5 class="mt-3">{{ permissionDeniedService.message() }}</h5>
            </div>
            <div class="modal-footer justify-content-center">
              <button
                type="button"
                class="btn btn-primary px-4"
                (click)="permissionDeniedService.hide()"
              >
                حسنا
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class PermissionDeniedPopupComponent {
  permissionDeniedService = inject(PermissionDeniedService);
}
