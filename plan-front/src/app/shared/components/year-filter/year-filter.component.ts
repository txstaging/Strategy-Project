import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-year-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="year-filter-container">
      <label for="year">تصفية السنة</label>
      <div class="select-wrapper">
        <div class="year-input" (click)="toggleYearList()" tabindex="0">
          <img src="assets/images/v6-icon.png" alt="" class="icon2" />
          {{ selectedYear || 'اختر السنة' }}
        </div>

        <div class="years-dropdown" *ngIf="isOpen">
          <div class="years-scroll">
            <div
              class="year-item"
              (click)="selectYear(null)"
              [class.selected]="selectedYear === null"
              tabindex="0"
            >
              اختر السنة
            </div>
            <div
              class="year-item"
              *ngFor="let year of years"
              (click)="selectYear(year)"
              [class.selected]="year === selectedYear"
              tabindex="0"
            >
              {{ year }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .year-filter-container {
        position: relative;
      }
      .select-wrapper {
        position: relative;
      }
      .year-input {
        border: 1px solid #ced4da;
        padding: 0.375rem 1.75rem;
        height: 40px;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: left 4px center;
        background-size: 1em;
        min-width: 150px;
      }

      .years-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ced4da;
        border-radius: 5px;
        min-width: 150px;
        margin-top: 5px;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-height: 200px;
      }
      .years-scroll {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        max-height: 200px;
        padding: 10px;
      }
      .year-item {
        padding: 8px 15px;
        text-align: center;
        cursor: pointer;
        border-radius: 4px;
      }
      .year-item:hover {
        background-color: #f0f0f0;
      }
      .year-item.selected {
        background-color: #00a05a;
        color: white;
      }
      .icon2 {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
      }
    `,
  ],
})
export class YearFilterComponent implements OnInit {
  @Input() paramKey = 'year';
  @Output() yearChange = new EventEmitter<string | null>();
  selectedYear: number | null = null;
  isOpen = false;
  years: number[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.generateYears();
  }

  private generateYears() {
    const currentYear = new Date().getFullYear();
    // Generate years from 10 years ago to 10 years in the future
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
      this.years.push(year);
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.selectedYear = params[this.paramKey]
        ? Number(params[this.paramKey])
        : null;
    });
  }

  toggleYearList() {
    this.isOpen = !this.isOpen;
  }

  selectYear(year: number | null) {
    this.selectedYear = year;
    this.isOpen = false;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.paramKey]: year },
      queryParamsHandling: 'merge',
    });

    this.yearChange.emit(year ? year.toString() : null);
  }
}
