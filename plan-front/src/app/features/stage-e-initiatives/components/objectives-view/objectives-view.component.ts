import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-objectives-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './objectives-view.component.html',
  styleUrl: './objectives-view.component.css'
})
export class ObjectivesViewComponent {
  @Input() selectedObjective: any;
  selectedObjectiveId = '';
}
