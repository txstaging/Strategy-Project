import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-objectives-stage-home',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './objectives-stage-home.component.html',
  styleUrl: './objectives-stage-home.component.css',
})
export class ObjectivesStageHomeComponent implements OnInit {
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const planId = params['planId'];

      if (planId) {
        this.sharedDataService.setPlanId(planId);
      } else {
        console.error('No planId found in route parameters');
      }
    });
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
