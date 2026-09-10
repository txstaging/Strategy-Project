import { Component } from '@angular/core';
import { PagesHeaderComponent } from '../../shared/components/pages-header/pages-header.component';
import { StrategicPlanSideBarComponent } from '../../features/stage-a-strategic-plan/components/strategic-plan-side-bar/strategic-plan-side-bar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-plans-layout',
  standalone: true,
  imports: [RouterOutlet, PagesHeaderComponent, StrategicPlanSideBarComponent],
  templateUrl: './plans-layout.component.html',
  styleUrl: './plans-layout.component.css',
})
export class PlansLayoutComponent {
  pageTitle = 'الخطة الاستراتيجية';
  pageDescriptionFirst = `قيادة سلاح الصيانة قيادة سلاح الصيانة قيادة سلاح الصيانة قيادة سلاح
        الصيانة قيادة سلاح الصيانة قيادة سلاح الصيانة قيادة سلاح الصيانة`;
  pageDescriptionSecond = `قيادة سلاح الصيانة قيادة سلاح الصيانة قيادة سلاح الصيانة قيادة سلاح
        الصيانة قيادة سلاح الصيانة قيادة سلاح الصيانة`;
}
