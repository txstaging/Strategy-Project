import { Component, inject } from '@angular/core';
import { AnalysisTableComponent } from '../../components/analysis-table/analysis-table.component';
import { PlanStatusService } from '../../services/PlanStatus.service';

@Component({
  selector: 'app-analysis-threats-page',
  standalone: true,
  imports: [AnalysisTableComponent],
  templateUrl: './analysis-threats-page.component.html',
  styleUrl: './analysis-threats-page.component.css',
})
export class AnalysisThreatsPageComponent {
  PlanStatusService = inject(PlanStatusService);
}
