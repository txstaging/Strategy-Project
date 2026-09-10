import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeneralApiService } from '../../../Core/Service/general-api.service';

interface Branch {
  id: number;
  name: string;
}

@Component({
  selector: 'app-branch-filter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './branch-filter.component.html',
  styleUrl: './branch-filter.component.css',
})
export class BranchFilterComponent implements OnInit {
  @Input() paramKey = 'unit';
  @Output() unitChange = new EventEmitter<string>();

  branches: Branch[] = [];
  selectedBranch = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private generalApiService: GeneralApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBranches();

    this.route.queryParams.subscribe((params) => {
      this.selectedBranch = params[this.paramKey] || '';
    });
  }

  private loadBranches() {
    this.generalApiService.getUnits().subscribe((data) => {
      this.branches = Array.isArray(data) ? data : data.data || [];
      this.cdr.detectChanges();
    });
  }

  onBranchChange() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.paramKey]: this.selectedBranch || null },
      queryParamsHandling: 'merge',
    });
    this.unitChange.emit(this.selectedBranch);
  }
}
