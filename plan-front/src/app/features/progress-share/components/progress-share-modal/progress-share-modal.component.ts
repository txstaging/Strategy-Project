import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IProgressOption,
  ProgressScope,
  progressScopeLabel,
} from '../../interfaces/IProgressShare';
import { ProgressShareService } from '../../services/progress-share.service';

interface PickerUser {
  id: number;
  displayName: string;
  unitName?: string;
}

// The «مشاركة نسبة الإنجاز» dialog. Opened from a row in the reports table
// with the item already chosen, or from the progress page where the user
// picks the item first. Either way the sender then chooses people and adds
// an optional note.
@Component({
  selector: 'app-progress-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progress-share-modal.component.html',
  styleUrl: './progress-share-modal.component.css',
})
export class ProgressShareModalComponent implements OnInit {
  private service = inject(ProgressShareService);
  private http = inject(HttpClient);

  // Preselected item, when opened from the reports table.
  @Input() preset?: IProgressOption | null;

  @Output() closed = new EventEmitter<void>();
  @Output() shared = new EventEmitter<number>();

  readonly scopeLabel = progressScopeLabel;

  options: IProgressOption[] = [];
  users: PickerUser[] = [];
  search = '';

  scopeFilter: ProgressScope | 'all' = 'all';
  selected: IProgressOption | null = null;
  note = '';
  userIds: number[] = [];
  saving = false;

  ngOnInit(): void {
    if (this.preset) this.selected = this.preset;

    this.service.options().subscribe({ next: (o) => (this.options = o) });

    // One page large enough for everyone, since there is no search endpoint.
    this.http
      .get<any>('/Account/GetAllUsers?perPage=1000&page=1')
      .subscribe({ next: (res) => (this.users = res?.data ?? []) });
  }

  get filteredOptions(): IProgressOption[] {
    const q = this.search.trim().toLowerCase();
    return this.options.filter(
      (o) =>
        (this.scopeFilter === 'all' || o.scope === Number(this.scopeFilter)) &&
        (!q || o.name.toLowerCase().includes(q) || (o.unitName ?? '').toLowerCase().includes(q))
    );
  }

  pick(o: IProgressOption): void {
    this.selected = o;
  }

  isSame(o: IProgressOption): boolean {
    return !!this.selected && this.selected.scope === o.scope && this.selected.scopeId === o.scopeId;
  }

  toggleUser(id: number): void {
    const i = this.userIds.indexOf(id);
    if (i === -1) this.userIds.push(id);
    else this.userIds.splice(i, 1);
  }

  isUserPicked = (id: number) => this.userIds.includes(id);

  get canSubmit(): boolean {
    return !this.saving && !!this.selected && this.userIds.length > 0;
  }

  submit(): void {
    if (!this.canSubmit || !this.selected) return;
    this.saving = true;

    this.service
      .create({
        scope: this.selected.scope,
        scopeId: this.selected.scopeId,
        note: this.note.trim() || null,
        userIds: this.userIds,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.shared.emit(res.id);
        },
        error: () => (this.saving = false),
      });
  }

  cancel(): void {
    this.closed.emit();
  }
}
