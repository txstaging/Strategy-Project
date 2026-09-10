import { Component, inject } from '@angular/core';
import { AnalysisTableComponent } from '../../components/analysis-table/analysis-table.component';
import { PlanStatusService } from '../../services/PlanStatus.service';

@Component({
  selector: 'app-analysis-strength-page',
  standalone: true,
  imports: [AnalysisTableComponent],
  templateUrl: './analysis-strength-page.component.html',
  styleUrl: './analysis-strength-page.component.css',
})
export class AnalysisStrengthPageComponent {
  PlanStatusService = inject(PlanStatusService);
}
