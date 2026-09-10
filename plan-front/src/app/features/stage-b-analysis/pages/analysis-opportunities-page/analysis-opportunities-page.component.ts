import { Component, inject } from '@angular/core';
import { AnalysisTableComponent } from '../../components/analysis-table/analysis-table.component';
import { PlanStatusService } from '../../services/PlanStatus.service';

@Component({
  selector: 'app-analysis-opportunities-page',
  standalone: true,
  imports: [AnalysisTableComponent],
  templateUrl: './analysis-opportunities-page.component.html',
  styleUrl: './analysis-opportunities-page.component.css',
})
export class AnalysisOpportunitiesPageComponent {
  PlanStatusService = inject(PlanStatusService);
}
