import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReportsService } from '../../services/reports.service';
import {
  IGetReportsResponse,
  Unit,
  Goal,
  Initiative,
  Project,
} from '../../interfaces/IGetReportsResponse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Extended interfaces for expandable functionality
interface ExpandableProject extends Project {
  expanded?: boolean;
}

interface ExpandableInitiative extends Omit<Initiative, 'projects'> {
  projects: ExpandableProject[];
  expanded?: boolean;
}

interface ExpandableGoal extends Omit<Goal, 'initiatives'> {
  initiatives: ExpandableInitiative[];
  expanded?: boolean;
}

interface ExpandableUnit extends Omit<Unit, 'goals'> {
  goals: ExpandableGoal[];
  expanded?: boolean;
}

@Component({
  selector: 'app-reports-collective-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-collective-report.component.html',
  styleUrl: './reports-collective-report.component.css',
})
export class ReportsCollectiveReportComponent implements OnInit {
  reportsData: ExpandableUnit[] = [];

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.reportsService.getReportsData().subscribe({
      next: (response: IGetReportsResponse) => {
        console.log(response)
        this.reportsData = response.map((unit) => ({
          ...unit,
          unitPercentage: this.roundToTwo(unit.unitPercentage || 0),
          expanded: true,
          goals: unit.goals.map((goal) => ({
            ...goal,
            goalPercentage: this.roundToTwo(goal.goalPercentage || 0),
            expanded: true,
            initiatives: goal.initiatives.map((initiative) => ({
              ...initiative,
              initiativePercentage: this.roundToTwo(
                initiative.initiativePercentage || 0
              ),
              expanded: true,
              projects: initiative.projects.map((project) => ({
                ...project,
                percentage: this.roundToTwo(project.percentage || 0),
                expanded: false,
              })),
            })),
          })),
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching reports data:', error);
        this.reportsData = [];
        this.cdr.detectChanges();
      },
    });
  }

  roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }
getProgressColor(value: number): string {
  if (value < 30) {
    return 'red';
  } else if (value < 70) {
    return 'orange';
  } else {
    return 'green';
  }
}


  toggleExpand(item: ExpandableUnit | ExpandableGoal | ExpandableInitiative) {
    item.expanded = !item.expanded;
    this.cdr.detectChanges();
  }

  // Print functionality
  async printTable(): Promise<void> {
    try {
      // Temporarily expand all sections for PDF generation
      const expandAllSections = () => {
        this.reportsData.forEach((unit) => {
          unit.expanded = true;
          unit.goals.forEach((goal) => {
            goal.expanded = true;
            goal.initiatives.forEach((initiative) => {
              initiative.expanded = true;
            });
          });
        });
        this.cdr.detectChanges();
      };

      expandAllSections();

      // Wait a bit for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the table element
      const tableElement = document.querySelector('table');
      if (!tableElement) {
        console.error('Table element not found');
        return;
      }

      // Create a wrapper div with proper styling
      const wrapper = document.createElement('div');
      wrapper.style.direction = 'rtl';
      wrapper.style.fontFamily = 'Arial, sans-serif';
      wrapper.style.fontSize = '12px';
      wrapper.style.padding = '20px';
      wrapper.style.backgroundColor = 'white';
      wrapper.style.width = '210mm'; // A4 width

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'التقرير المجمع';
      title.style.textAlign = 'center';
      title.style.color = '#28a745';
      title.style.marginBottom = '30px';
      title.style.fontSize = '20px';
      wrapper.appendChild(title);

      // Clone and style the table
      const tableClone = tableElement.cloneNode(true) as HTMLElement;
      tableClone.style.width = '100%';
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.fontSize = '10px';

      // Remove all Bootstrap icons and buttons from the cloned table
      const iconsAndButtons = tableClone.querySelectorAll(
        'i, button, .d-print-none, .arrow-icon'
      );
      iconsAndButtons.forEach((element) => {
        element.remove();
      });

      // Clean up button containers that might be empty now
      const emptyContainers = tableClone.querySelectorAll('.d-flex.gap-2');
      emptyContainers.forEach((container) => {
        if (container.children.length === 0) {
          container.remove();
        }
      });

      // Style all cells
      const cells = tableClone.querySelectorAll('th, td');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.border = '1px solid #333';
        cellElement.style.padding = '8px';
        cellElement.style.textAlign = 'right';
        cellElement.style.verticalAlign = 'top';
      });

      // Style headers
      const headers = tableClone.querySelectorAll('th');
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        headerElement.style.backgroundColor = '#28a745';
        headerElement.style.color = 'white';
        headerElement.style.fontWeight = 'bold';
        headerElement.style.textAlign = 'center';
      });

      wrapper.appendChild(tableClone);

      // Add footer
      const footer = document.createElement('div');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '20px';
      footer.style.fontSize = '10px';
      footer.style.color = '#666';
      footer.textContent = `تم إنشاء التقرير في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}`;
      wrapper.appendChild(footer);

      // Temporarily add to body for rendering
      document.body.appendChild(wrapper);

      // Generate PDF
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });

      // Remove wrapper from body
      document.body.removeChild(wrapper);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Download the PDF
      const fileName = `التقرير-المجمع-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  }

  sortProjectsByPriority(projects: Project[]): Project[] {
    const priorityOrder: Record<string, number> = {
      'أولوية أولى': 1,
      'أولوية ثانية': 2,
      'أولوية ثالثة': 3,
    };
    return projects.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
    );
  }

  getProjectsByPriority(
    initiative: ExpandableInitiative,
    priority: string
  ): ExpandableProject[] {
    return initiative.projects.filter((p) => p.priority === priority);
  }
}
