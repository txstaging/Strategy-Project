import { InitiativesService } from '../../../stage-e-initiatives/services/initiatives.service';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
} from '@angular/core';

@Component({
  selector: 'app-project-initiatives-view',
  standalone: true,
  imports: [],
  templateUrl: './project-initiatives-view.component.html',
  styleUrl: './project-initiatives-view.component.css',
})
export class ProjectInitiativesViewComponent {
  @Input() isOpen = false;
  @Input() set initiativeId(value: string) {
    if (value && this.planId) {
      this.loadInitiativeDetails(value);
    }
  }
  @Input() planId = '';
  @Output() closed = new EventEmitter<void>();

  initiativeDetails: any;

  constructor(
    private initiativesService: InitiativesService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  loadInitiativeDetails(id: string) {
    this.initiativesService
      .getInitiativeById(Number(id))
      .subscribe((response) => {
        this.initiativeDetails = response;
        this.changeDetectorRef.detectChanges();
      });
  }

  close() {
    this.closed.emit();
  }
}
