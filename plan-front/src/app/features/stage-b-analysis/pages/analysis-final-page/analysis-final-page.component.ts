import { Component } from '@angular/core';
import { AnalysisAllTablesComponent } from "../analysis-all-tables/analysis-all-tables.component";

@Component({
  selector: 'app-analysis-final-page',
  standalone: true,
  imports: [AnalysisAllTablesComponent],
  templateUrl: './analysis-final-page.component.html',
  styleUrl: './analysis-final-page.component.css',
})
export class AnalysisFinalPageComponent {}
