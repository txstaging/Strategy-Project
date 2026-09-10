import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageTitleService } from '../../services/page-title.service';
import { IPageTitle } from '../../interfaces/IPageTitle';

@Component({
  selector: 'app-title-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './title-management.component.html',
  styleUrl: './title-management.component.css',
})
export class TitleManagementComponent implements OnInit {
  titles = signal<IPageTitle[]>([]);
  filteredTitles = signal<IPageTitle[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  searchTerm = '';
  selectedPage = '';
  pageNames = signal<string[]>([]);
  editingId: number | null = null;
  editValue = '';
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(private pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.loadTitles();
  }

  loadTitles(): void {
    this.isLoading.set(true);
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        this.titles.set(res.titles);
        const pages = [...new Set(res.titles.map(t => t.pageName))];
        this.pageNames.set(pages);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('حدث خطأ في تحميل العناوين');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    let result = this.titles();
    if (this.selectedPage) {
      result = result.filter(t => t.pageName === this.selectedPage);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        t =>
          t.currentValue.toLowerCase().includes(term) ||
          t.defaultValue.toLowerCase().includes(term) ||
          t.key.toLowerCase().includes(term)
      );
    }
    this.filteredTitles.set(result);
  }

  startEdit(title: IPageTitle): void {
    this.editingId = title.id;
    this.editValue = title.currentValue;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editValue = '';
  }

  saveEdit(title: IPageTitle): void {
    if (!this.editValue.trim() || this.editValue === title.currentValue) {
      this.cancelEdit();
      return;
    }
    this.isSaving.set(true);
    this.pageTitleService.updateTitle(title.id, this.editValue.trim()).subscribe({
      next: () => {
        title.currentValue = this.editValue.trim();
        this.editingId = null;
        this.editValue = '';
        this.isSaving.set(false);
        this.showSuccess('تم تحديث العنوان بنجاح');
      },
      error: () => {
        this.isSaving.set(false);
        this.showError('حدث خطأ في تحديث العنوان');
      },
    });
  }

  resetTitle(title: IPageTitle): void {
    if (title.currentValue === title.defaultValue) return;
    this.pageTitleService.resetTitle(title.id).subscribe({
      next: () => {
        title.currentValue = title.defaultValue;
        this.showSuccess('تم إعادة تعيين العنوان');
      },
      error: () => {
        this.showError('حدث خطأ في إعادة تعيين العنوان');
      },
    });
  }

  resetAllTitles(): void {
    this.pageTitleService.resetAllTitles().subscribe({
      next: () => {
        this.loadTitles();
        this.showSuccess('تم إعادة تعيين جميع العناوين');
      },
      error: () => {
        this.showError('حدث خطأ في إعادة تعيين العناوين');
      },
    });
  }

  isModified(title: IPageTitle): boolean {
    return title.currentValue !== title.defaultValue;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 3000);
  }
}
