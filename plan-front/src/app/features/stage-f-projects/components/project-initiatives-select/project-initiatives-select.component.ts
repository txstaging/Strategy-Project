import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanProjectsService } from '../../services/plan-projects.service';
import { ProjectInitiativesViewComponent } from '../project-initiatives-view/project-initiatives-view.component';

@Component({
  selector: 'app-project-initiatives-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectInitiativesViewComponent],
  templateUrl: './project-initiatives-select.component.html',
  styleUrl: './project-initiatives-select.component.css',
})
export class ProjectInitiativesSelectComponent implements OnChanges {
  @Input() planId = '';
  @Input() goalId = '';
  @Output() initiativeSelected = new EventEmitter<{
    id: string;
    name: string;
  }>();

  initiatives: any[] = [];
  selectedInitiativeId = signal<string>('');
  selectedInitiativeValue = '';

  constructor(private planProjectsService: PlanProjectsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['planId'] || changes['goalId']) {
      if (this.planId && this.goalId) {
        this.loadInitiatives();
      } else {
        // Reset initiatives when planId or goalId is not available
        this.initiatives = [];
        this.selectedInitiativeValue = '';
        this.selectedInitiativeId.set('');
        // Emit empty selection when resetting
        this.initiativeSelected.emit({
          id: '',
          name: '',
        });
      }
    }
  }

  loadInitiatives() {
    this.planProjectsService.getAcceptableInitiative(this.planId).subscribe({
      next: (response) => {
        // The service already extracts the data, so use response directly
        this.initiatives = response || [];
        console.log('Loaded initiatives:', this.initiatives);
      },
      error: (error) => {
        console.error('Error loading initiatives:', error);
        this.initiatives = [];
      },
    });
  }

  onInitiativeChange() {
    this.selectedInitiativeId.set(this.selectedInitiativeValue);

    if (this.selectedInitiativeValue) {
      const selectedInitiative = this.initiatives.find(
        (i) => i.id.toString() === this.selectedInitiativeValue
      );

      if (selectedInitiative) {
        console.log('Emitting initiative selection:', {
          id: this.selectedInitiativeValue,
          name: selectedInitiative.name,
        });
        this.initiativeSelected.emit({
          id: this.selectedInitiativeValue,
          name: selectedInitiative.name,
        });
      }
    } else {
      // Reset when no initiative is selected
      console.log('Emitting empty initiative selection');
      this.initiativeSelected.emit({
        id: '',
        name: '',
      });
    }
  }

  getSelectedInitiativeName() {
    const initiative = this.initiatives.find(
      (i) => i.id.toString() === this.selectedInitiativeId()
    );

    return initiative?.name || '';
  }

  openInitiativeDetails(id: string) {
    this.selectedInitiativeId.set(id);
  }

  closeInitiativeModal() {
    this.selectedInitiativeId.set('');
  }
}
