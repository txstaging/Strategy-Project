import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stages-header',
  standalone: true,
  imports: [],
  templateUrl: './stages-header.component.html',
  styleUrl: './stages-header.component.css',
})
export class StagesHeaderComponent {
  stageTitle = input.required<string>();
  stageDescription = input.required<string>();
}
