import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PendingStatuses,
  ApprovalStatuses,
  RejectionStatuses,
  StatusesArabicNames,
  ApprovalStatusEnum,
  ReturnedStatuses,
} from '../../../Core/utilities/consts';

@Component({
  selector: 'app-status-action',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="status-wrapper position-relative">
      <div (click)="showComment()" tabindex="0" role="button">
        <span [ngClass]="getStatusColor(status!)">
          <i class="bi" [ngClass]="getIconClass(status!)"></i>
          {{ statusesArabicNames[status!] }}
        </span>
      </div>

      <div
        *ngIf="isCommentVisible && (comment || '')"
        class="comment-popup position-absolute bg-white p-2 border rounded shadow-sm"
      >
        <textarea
          [value]="comment"
          readonly
          class="form-control"
          rows="3"
        ></textarea>
      </div>
    </div>
  `,
  styles: [
    `
      .status-wrapper {
        display: inline-block;
      }
      .comment-popup {
        top: 100%;
        right: 0;
        z-index: 1000;
        min-width: 200px;
        margin-top: 5px;
      }
    `,
  ],
})
export class StatusActionComponent {
  @Input() status?: string;
  @Input() comment?: string;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isCommentVisible = false;
    }
  }

  isCommentVisible = false;

  statusesArabicNames: Record<string, string> = StatusesArabicNames;

  showComment() {
    if (this.comment) {
      this.isCommentVisible = !this.isCommentVisible;
    }
  }

  getStatusColor(status: string): string {
    if (status === ApprovalStatusEnum.SavedAsDraft) {
      return 'text-secondary';
    } else if (PendingStatuses.includes(status as ApprovalStatusEnum)) {
      return 'text-warning';
    } else if (ApprovalStatuses.includes(status as ApprovalStatusEnum)) {
      return 'text-success';
    } else if (ReturnedStatuses.includes(status as ApprovalStatusEnum)) {
      return 'text-primary';
    } else if (RejectionStatuses.includes(status as ApprovalStatusEnum)) {
      return 'text-danger';
    } else if ('Approved' === status) {
      return 'text-success';
    } else if ('Returned' === status) {
      return 'text-primary';
    } else if ('Rejected' === status) {
      return 'text-danger';
    } else {
      return '';
    }
  }

  getIconClass(status: string): string {
    if (status === ApprovalStatusEnum.SavedAsDraft) {
      return 'bi-file-earmark';
    } else if (ApprovalStatuses.includes(status as ApprovalStatusEnum)) {
      return 'bi-check-lg';
    } else if (PendingStatuses.includes(status as ApprovalStatusEnum)) {
      return 'bi-chat';
    } else if (RejectionStatuses.includes(status as ApprovalStatusEnum)) {
      return 'bi-x-lg';
    } else if (ReturnedStatuses.includes(status as ApprovalStatusEnum)) {
      return 'bi-chat-dots';
    } else if ('Approved' === status) {
      return 'bi-check-lg';
    } else if ('Returned' === status) {
      return 'bi-chat-dots';
    } else if ('Rejected' === status) {
      return 'bi-x-lg';
    } else {
      return '';
    }
  }
}
