import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-container">
      <!-- First Page -->
      <button
        class="pagination-btn"
        [disabled]="currentPage === 1"
        (click)="onPageChange(1)"
        title="الصفحة الأولى"
      >
        <i class="bi bi-chevron-double-right"></i>
      </button>

      <!-- Previous Page -->
      <button
        class="pagination-btn"
        [disabled]="currentPage === 1"
        (click)="onPageChange(currentPage - 1)"
        title="الصفحة السابقة"
      >
        <i class="bi bi-chevron-right"></i>
      </button>

      <div class="pages">
        <button
          *ngFor="let page of visiblePages"
          class="page-number"
          [class.active]="page === currentPage"
          (click)="onPageChange(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- Next Page -->
      <button
        class="pagination-btn"
        [disabled]="currentPage === totalPages"
        (click)="onPageChange(currentPage + 1)"
        title="الصفحة التالية"
      >
        <i class="bi bi-chevron-left"></i>
      </button>

      <!-- Last Page -->
      <button
        class="pagination-btn"
        [disabled]="currentPage === totalPages"
        (click)="onPageChange(totalPages)"
        title="الصفحة الأخيرة"
      >
        <i class="bi bi-chevron-double-left"></i>
      </button>

      <!-- Jump to Page -->
      <div class="jump-container">
        <span>انتقال إلى:</span>
        <input
          type="number"
          min="1"
          [max]="totalPages"
          [(ngModel)]="jumpToPage"
          class="jump-input"
          (keyup.enter)="jumpToPageHandler()"
        />
        <button
          class="jump-btn"
          (click)="jumpToPageHandler()"
          [disabled]="!isValidPageNumber(jumpToPage)"
        >
          انتقال
        </button>
      </div>
    </div>

    <div class="pagination-info">
      عرض {{ currentPage }} من {{ totalPages }} صفحة (إجمالي {{ total }} سجل)
    </div>
  `,
  styles: [
    `
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 20px 0 10px;
        flex-wrap: wrap;
      }
      .pagination-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border: 1px solid #ced4da;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        line-height: 0;
      }
      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .pages {
        display: flex;
        gap: 5px;
      }
      .page-number {
        padding: 8px 12px;
        border: 1px solid #ced4da;
        background: white;
        border-radius: 4px;
        cursor: pointer;
      }
      .page-number.active {
        background: #00a05a;
        color: white;
        border-color: #00a05a;
      }
      .jump-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 10px;
      }
      .jump-input {
        width: 60px;
        padding: 6px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        text-align: center;
      }
      .jump-btn {
        padding: 6px 10px;
        background: #f8f9fa;
        border: 1px solid #ced4da;
        border-radius: 4px;
        cursor: pointer;
      }
      .jump-btn:hover {
        background: #e9ecef;
      }
      .jump-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .pagination-info {
        text-align: center;
        color: #6c757d;
        font-size: 14px;
        margin-bottom: 20px;
      }
    `,
  ],
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Input() perPage = 10;
  @Output() pageChange = new EventEmitter<number>();

  jumpToPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    // Recalculate totalPages if total or perPage changes
    if ((changes['total'] || changes['perPage']) && this.total && this.perPage) {
      this.totalPages = Math.ceil(this.total / this.perPage);
    }

    // Reset jump to page input when current page changes
    if (changes['currentPage']) {
      this.jumpToPage = this.currentPage;
    }
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(this.totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  jumpToPageHandler() {
    if (this.isValidPageNumber(this.jumpToPage)) {
      this.onPageChange(this.jumpToPage);
    }
  }

  isValidPageNumber(page: number): boolean {
    return !isNaN(page) && page >= 1 && page <= this.totalPages;
  }
}
