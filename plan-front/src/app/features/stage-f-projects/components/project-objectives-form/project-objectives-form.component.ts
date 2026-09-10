import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// import { ObjectivesViewComponent } from '../objectives-view/objectives-view.component';
import { InitiativesService } from '../../../stage-e-initiatives/services/initiatives.service';

@Component({
  selector: 'app-project-objectives-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-objectives-form.component.html',
  styleUrl: './project-objectives-form.component.css',
})
export class ProjectObjectivesFormComponent implements OnInit, OnChanges {
  @Output() objectiveSelected = new EventEmitter<string>();
  @Input() planId = '';
  @Input() goalId: any = '';
  @Input() isView = false;
  objectives = signal<any[]>([]);
  selectedObjective = signal<any>(null);
  selectedObjectiveId = '';

  constructor(private initiativesService: InitiativesService) {}

  ngOnInit() {
    if (!this.isView) this.loadObjectives();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['goalId'] && this.isView) {
      this.loadObjectives();
    }
  }

  loadObjectives() {
    this.initiativesService.getAcceptableGoals(this.planId).subscribe((res) => {
      this.objectives.set(res.data);
      if (this.goalId) {
        this.onObjectiveSelect(this.goalId);
      }
    });
  }

  onObjectiveSelect(event: any) {
    const selectedId = event?.target?.value || event;
    this.selectedObjective.set(
      this.objectives().find((obj) => obj.id === Number(selectedId))
    );

    this.objectiveSelected.emit(selectedId);
  }
}
