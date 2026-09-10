import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PlanStatusService } from '../../services/PlanStatus.service';

import { AnalysisOpportunitiesPageComponent } from '../analysis-opportunities-page/analysis-opportunities-page.component';
import { AnalysisRisksPageComponent } from '../analysis-risks-page/analysis-risks-page.component';
import { AnalysisStrengthPageComponent } from '../analysis-strength-page/analysis-strength-page.component';
import { AnalysisThreatsPageComponent } from '../analysis-threats-page/analysis-threats-page.component';

import { PdfService } from '../../../../pdf.service';
import { ApproveAllService } from '../../../../approve-all.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';

@Component({
  selector: 'app-analysis-all-tables',
  standalone: true,
  imports: [
    AnalysisStrengthPageComponent,
    AnalysisOpportunitiesPageComponent,
    AnalysisRisksPageComponent,
    AnalysisThreatsPageComponent,
  ],
  templateUrl: './analysis-all-tables.component.html',
  styleUrl: './analysis-all-tables.component.css',
})
export class AnalysisAllTablesComponent implements OnInit {

  planId!: number;

  // services
  PlanStatusService = inject(PlanStatusService);

  constructor(
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private app:ApproveAllService,
    private readonly authService :AuthService,
  ) {
    this.isAdmin = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);
  }

  ngOnInit(): void {
    /**
     * IMPORTANT:
     * planId جاي من parent route
     * مثال URL:
     * /plans/11/direction-stage
     */console.log('CHILD PARAMS:', this.route.snapshot.paramMap.keys);
  console.log('PARENT PARAMS:', this.route.parent?.snapshot.paramMap.keys);
  console.log('PARENT VALUE plans:', this.route.parent?.snapshot.paramMap.get('plans'));
  console.log('PARENT VALUE planId:', this.route.parent?.snapshot.paramMap.get('planId'));
    const planParam = this.route.parent?.snapshot.paramMap.get('planId');
    // لو اسم الـ param عندك :planId بدل :plans
    // غيّر السطر لفوق لـ get('planId')

    console.log('PLAN ID FROM URL:', planParam);

    if (!planParam) {
      console.error('planId مش موجود في الـ URL');
      return;
    }

    this.planId = Number(planParam);
  }
  isAdmin=false;
  generatePDF(): void {
    if (!this.planId) {
      console.error('planId مش متحمّل');
      return;
    }

    this.pdfService.getPdffora(this.planId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: err => {
        console.error('Error generating PDF', err);
      }
    });
  }
  Approve():void
  {
    if (!this.planId) {
      console.error('planId مش متحمّل');
      return;
    }

    this.app.approvePoints(this.planId).subscribe({
      next: blob => {
        window.location.reload();
        
      },
      error: err => {
        console.error('Error generating PDF', err);
      }
    });

  }
}
