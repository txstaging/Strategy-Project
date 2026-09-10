import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  ModuleType,
  PermissionsService,
} from '../../../Core/Service/permissions.service';

@Component({
  selector: 'app-admin-actions',
  standalone: true,
  imports: [],
  template: `
    <div class="d-flex align-items-center">
      <svg
        tabindex="0"
        width="27"
        height="27"
        viewBox="0 0 27 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="cursor: pointer"
        (click)="onAccept()"
        (keydown.enter)="onAccept()"
      >
        <circle
          cx="13.5"
          cy="13.5"
          r="13.5"
          fill="white"
          stroke="#EBEBEB"
        />
        <path
          d="M18.819 10.1946C19.06 10.4828 19.06 10.9151 18.819 11.1745L11.752 18.7838C11.484 19.0721 11.083 19.0721 10.842 18.7838L7.201 14.8639C6.933 14.6045 6.933 14.1721 7.201 13.9127C7.442 13.6245 7.843 13.6245 8.084 13.9127L11.27 17.3427L17.909 10.1946C18.15 9.9351 18.552 9.9351 18.793 10.1946H18.819Z"
          fill="#75B940"
        />
      </svg>
      <div
        style="
        width: 21px;
        height: 0px;
        transform: rotate(-90deg);
        border: 1px #ebebeb solid;
      "
      ></div>
      <svg
        tabindex="0"
        width="27"
        height="27"
        viewBox="0 0 27 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="cursor: pointer"
        (click)="onReject()"
        (keydown.enter)="onReject()"
      >
        <circle
          cx="13.5"
          cy="13.5"
          r="13.5"
          fill="white"
          stroke="#EBEBEB"
        />
        <path
          d="M17.789 10.2724L14.042 14.0195L17.758 17.7354C18.07 18.0164 18.07 18.4848 17.758 18.7658C17.477 19.0781 17.009 19.0781 16.728 18.7658L13.98 15.05L10.265 18.7658C9.984 19.0781 9.515 19.0781 9.234 18.7658C8.922 18.4848 8.922 18.0164 9.234 17.7041L12.95 13.9883L9.234 10.2724C8.922 9.9914 8.922 9.523 9.234 9.2108C9.515 8.9297 9.984 8.9297 10.296 9.2108L14.012 12.9578L17.728 9.242C18.009 8.9297 18.477 8.9297 18.789 9.242C19.07 9.523 19.07 9.9914 18.789 10.2724Z"
          fill="#E74545"
        />
      </svg>
      <div
        style="
        width: 21px;
        height: 0px;
        transform: rotate(-90deg);
        border: 1px #ebebeb solid;
      "
      ></div>
      <svg
        tabindex="0"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="cursor: pointer"
        (click)="onReturn()"
        (keydown.enter)="onReturn()"
      >
        <circle cx="14" cy="14" r="13.5" fill="white" stroke="#EBEBEB" />
        <path
          d="M18.4473 16.2804C18.8099 15.5749 18.9994 14.7932 19 14C19 11.2432 16.7568 9 14 9C11.2432 9 9 11.2432 9 14C9 16.7568 11.2432 18.9999 14 18.9999C14.7918 18.9999 15.5764 18.8095 16.2809 18.4477L18.4355 18.9863C18.5116 19.0055 18.5913 19.0045 18.6669 18.9836C18.7426 18.9626 18.8114 18.9223 18.8668 18.8667C18.9223 18.8112 18.9625 18.7423 18.9835 18.6666C19.0044 18.5909 19.0054 18.5111 18.9864 18.4349L18.4473 16.2804ZM17.5232 16.3304L17.9205 17.9204L16.3305 17.5227C16.2181 17.4949 16.0993 17.5108 15.9982 17.5672C15.388 17.91 14.6999 18.0903 14 18.0908C11.7441 18.0908 9.90909 16.2554 9.90909 14C9.90909 11.7445 11.7441 9.90908 14 9.90908C16.2559 9.90908 18.0909 11.7445 18.0909 14C18.0903 14.6997 17.9102 15.3875 17.5677 15.9977C17.5107 16.0988 17.4948 16.2179 17.5232 16.3304Z"
          fill="#458BE7"
        />
      </svg>
    </div>
  `,
})
export class ActionsAdminComponent {
  @Input() item: any; // Can hold item ID or other data
  @Input() itemId: number | null = null; // Explicit item ID input
  @Input() isMain: boolean = false;


  @Input() set pageName(value: ModuleType | null) {
    this._pageName.set(value || 'Direction'); // Default to Direction if null
  }
  get pageName(): ModuleType | null {
    return this._pageName();
  }
  private _pageName = signal<ModuleType | null>('Direction'); // Default initialization

  @Output() accept = new EventEmitter<any>();
  @Output() reject = new EventEmitter<any>();
  @Output() return = new EventEmitter<any>();

  // Action buttons are gated by the user's module permissions (Approve/Reject/Return)
  hasApprovePermission = computed(() =>
    this.permissionsService.isAllowedToAccess(this._pageName() ?? 'Direction', [
      'Approve',
    ])
  );
  hasRejectPermission = computed(() =>
    this.permissionsService.isAllowedToAccess(this._pageName() ?? 'Direction', [
      'Reject',
    ])
  );
  hasReturnPermission = computed(() =>
    this.permissionsService.isAllowedToAccess(this._pageName() ?? 'Direction', [
      'Return',
    ])
  );
  hasAnyPermission = computed(
    () =>
      this.hasApprovePermission() ||
      this.hasRejectPermission() ||
      this.hasReturnPermission()
  );

  constructor(private permissionsService: PermissionsService) {}

  onAccept() {
    // Prioritize itemId if provided, otherwise fall back to item
    this.accept.emit(this.itemId !== null ? this.itemId : this.item);
  }

  onReject() {
    // Prioritize itemId if provided, otherwise fall back to item
    this.reject.emit(this.itemId !== null ? this.itemId : this.item);
  }

  onReturn() {
    // Prioritize itemId if provided, otherwise fall back to item
    this.return.emit(this.itemId !== null ? this.itemId : this.item);
  }
}
