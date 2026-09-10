import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ObjectiveService } from '../../services/objective.service';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { BranchFilterComponent } from '../../../../shared/components/branch-filter/branch-filter.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { YearFilterComponent } from '../../../../shared/components/year-filter/year-filter.component';

@Component({
  selector: 'app-objectives-stage-history',
  standalone: true,
  imports: [
    CommonModule,
    StatusActionComponent,
    YearFilterComponent,
    BranchFilterComponent,
    PaginationComponent,
  ],
  templateUrl: './objectives-stage-history.component.html',
  styleUrl: './objectives-stage-history.component.css',
})
export class ObjectivesStageHistoryComponent implements OnInit {
  ObjectivesList = signal<any[]>([]);
  currentPage = 1;
  totalPages: any = null;
  planId: string;

  constructor(
    private objectiveService: ObjectiveService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private sharedDataService: SharedDataService
  ) {
    this.planId = this.sharedDataService.getPlanId();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const Year = params['year'];
      const UnitId = params['UnitId'];
      const selectedParams: any = {};
      if (UnitId) selectedParams['UnitId'] = UnitId;
      if (Year) selectedParams['Year'] = Year;
      this.loadObjectives(selectedParams);
    });
  }

  loadObjectives(params: any = {}) {
    return params;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadObjectives({
      page: page,
      ...this.route.snapshot.queryParams,
    });
  }
}
