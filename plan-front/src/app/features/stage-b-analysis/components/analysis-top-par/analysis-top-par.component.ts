import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-analysis-top-par',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './analysis-top-par.component.html',
  styleUrl: './analysis-top-par.component.css',
})
export class AnalysisTopParComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  planId: string | null = null;

  navTabs = [
    {
      label: 'عرض التحليل',
      isDynamic: true,
    },
    {
      label: 'القوة',
      path: 'Strength',
      isDynamic: true,
    },
    { label: 'الفرص', path: 'Opportunities', isDynamic: false },
    { label: 'الضعف', path: 'Risks', isDynamic: false },
    { label: 'التهديدات', path: 'Threats', isDynamic: false },
    { label: 'الأولوية', path: 'Priorities', isDynamic: false },
    {
      label: 'التحليل النهائي',
      path: 'FinalAnalysis',
      isDynamic: false,
    },
  ];

  ngOnInit(): void {
    this.planId = this.route.snapshot.paramMap.get('planId');
  }
}
