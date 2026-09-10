import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InitiativesService } from '../../services/initiatives.service';
import { IAllAcceptedObjectvies } from '../../interfaces/IAllAcceptedObjectvies';

@Component({
  selector: 'app-objectives-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './objectives-form.component.html',
  styleUrl: './objectives-form.component.css',
})
export class ObjectivesFormComponent implements OnInit {
  @Output() objectiveSelected = new EventEmitter<string>();
  @Input() planId = '';
  @Input() goalId: any = '';
  objectives = signal<IAllAcceptedObjectvies[]>([]);
  selectedObjective = signal<any>(null);
  selectedObjectiveId = '';

  constructor(private initiativesService: InitiativesService) {}

  ngOnInit() {
    this.loadObjectives();
  }

  loadObjectives() {
    this.initiativesService
      .getAcceptableInitiatives(this.planId)
      .subscribe((res) => {
        this.objectives.set(res);
        if (this.goalId) this.onObjectiveSelect(this.goalId);
      });
  }

  onObjectiveSelect(event: any) {
    const selectedId = event?.target?.value || event;

    // Update the selectedObjectiveId for proper ngModel sync
    this.selectedObjectiveId = selectedId.toString();

    // Find and set the selected objective
    const foundObjective = this.objectives().find(
      (obj) => obj.id === Number(selectedId)
    );

    this.selectedObjective.set(foundObjective);

    // Emit the selection event to parent
    this.objectiveSelected.emit(selectedId);
  }
}
