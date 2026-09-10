import { Component } from '@angular/core';
import { AnalysisAllTablesComponent } from '../analysis-all-tables/analysis-all-tables.component';

@Component({
  selector: 'app-analysis-priority-page',
  standalone: true,
  imports: [AnalysisAllTablesComponent],
  templateUrl: './analysis-priority-page.component.html',
  styleUrl: './analysis-priority-page.component.css',
})
export class AnalysisPriorityPageComponent {}
