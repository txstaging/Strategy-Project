import { NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  ApprovalStatusEnum,
  DeletableStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../../features/auth/services/auth.service';
import {
  ModuleType,
  PermissionsService,
} from '../../../Core/Service/permissions.service';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [NgIf],

  template: `
    <div [style.position]="'relative'">
      <i
        #triggerElement
        (click)="togglePopup($event)"
        tabindex="0"
        class="bi bi-three-dots-vertical fs-5"
        style="cursor: pointer; color: #0d6efd; display: block;"
      >
      </i>

      <div
        class="popup-menu"
        *ngIf="visible"
        [style.top]="position.top"
        [style.left]="position.left"
      >
        <ul>
          <li
            (click)="onOptionClick('view')"
            (keydown.enter)="onOptionClick('view')"
            (keydown.space)="onOptionClick('view')"
            style="color: #00A05A"
            tabindex="0"
            class="d-flex justify-content-start gap-2"
          >
            <i class="bi bi-eye"></i>
            استعراض
          </li>
          @if (
            pageName &&
            (customCanEdit === true ||
              (customCanEdit !== false &&
                (hasUpdatePermission() || canEditBasedOnStatus())))
          ) {
            <li
              (click)="onOptionClick('edit')"
              (keydown.enter)="onOptionClick('edit')"
              (keydown.space)="onOptionClick('edit')"
              style="color: #1B221F"
              class="d-flex justify-content-start gap-2"
              tabindex="0"
            >
              <i class="bi bi-pencil-square"></i> تعديل
            </li>
          }
          @if (pageName && hasDeletePermission() && customCanDelete !== false) {
            <li
              (click)="onOptionClick('delete')"
              (keydown.enter)="onOptionClick('delete')"
              (keydown.space)="onOptionClick('delete')"
              style="color: #E74545"
              class="d-flex justify-content-start gap-2"
              tabindex="0"
            >
              <i class="bi bi-trash3"></i> حذف
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .popup-menu {
        position: absolute;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        padding: 10px;
        z-index: 1000;
      }
      .popup-menu ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .popup-menu li {
        padding: 5px 10px;
        cursor: pointer;
      }
      .popup-menu li:hover {
        background-color: #f5f5f5;
      }
    `,
  ],
})
export class PopupComponent {
  @Input() set pageName(value: ModuleType | null) {
    this._pageName.set(value);
  }
  get pageName(): ModuleType | null {
    return this._pageName();
  }
  private _pageName = signal<ModuleType | null>(null);

  @Input() itemId = null;
  @Input() item = null;
  @Input() position = { top: '0px', left: '0px' };
  @Input() customCanEdit?: boolean; // Custom edit permission from parent
  @Input() customCanDelete?: boolean; // Custom delete permission from parent
  @Output() optionSelected = new EventEmitter<Record<string, any>>();
  visible = false;

  hasUpdatePermission = computed(() => {
    const page = this._pageName();
    return page
      ? this.permissionsService.isAllowedToAccess(page, ['Update'])
      : false;
  });

  hasDeletePermission = computed(() => {
    const page = this._pageName();
    if (!page) return false;

    // Who may delete is decided by the Delete permission granted in the admin
    // matrix, exactly as Update is handled above. This used to be hardcoded to
    // the unit employee, so granting الحذف to any other role had no effect on
    // the UI and the client's configured permissions were ignored.
    if (!this.permissionsService.isAllowedToAccess(page, ['Delete'])) {
      return false;
    }

    // What may be deleted is decided by the item's own status: anything that has
    // not been finally approved yet.
    if (!this.item || !this.item['status']) {
      return false;
    }

    return DeletableStatuses.includes(this.item['status'] as ApprovalStatusEnum);
  });

  constructor(
    private elementRef: ElementRef,
    private permissionsService: PermissionsService,
    private authService: AuthService
  ) {}

  /**
   * Checks if the current user can edit the item based on its status
   * Employees can edit items that are in pending, returned, or rejected status
   */
  canEditBasedOnStatus(): boolean {
    // If item is null or doesn't have status, return false
    if (!this.item || !this.item['status']) return false;

    // Get the current user role
    const userRole = this.authService.getUserRole();
    if (!userRole) return false;

    // If user is not an employee, this function is not relevant
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Check item status
    const itemStatus = this.item['status'] as ApprovalStatusEnum;
    const isReturned = ReturnedStatuses.includes(itemStatus);
    const isRejected = RejectionStatuses.includes(itemStatus);
    const isDraft = itemStatus === ApprovalStatusEnum.SavedAsDraft;

    return isReturned || isRejected || isDraft;
  }

  togglePopup(event: MouseEvent) {
    event.stopPropagation();
    this.visible = !this.visible;
    if (this.visible) {
      const trigger = event.target as HTMLElement;
      trigger.getBoundingClientRect();
      this.position = {
        top: '100%',
        left: '0',
      };
    }
  }

  onOptionClick(option: string): void {
    this.optionSelected.emit({
      type: option,
      id: this.itemId,
      item: this.item,
    });
    this.visible = false;
  }
}
