import { Component, inject } from '@angular/core';
import { AnalysisTableComponent } from '../../components/analysis-table/analysis-table.component';
import { PlanStatusService } from '../../services/PlanStatus.service';

@Component({
  selector: 'app-analysis-risks-page',
  standalone: true,
  imports: [AnalysisTableComponent],
  templateUrl: './analysis-risks-page.component.html',
  styleUrl: './analysis-risks-page.component.css',
})
export class AnalysisRisksPageComponent {
  PlanStatusService = inject(PlanStatusService);
}
