import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-reports-collective-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-collective-template.component.html',
  styleUrl: './reports-collective-template.component.css',
})
export class ReportsCollectiveTemplateComponent implements OnInit {
  constructor(
    public router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  reportsData: Unit[] = [];
  selectedUnitId = signal<number | null>(null);

  // Computed filtered data based on selected unit
  get filteredData(): Unit[] {
    const unitId = this.selectedUnitId();
    if (unitId === null) {
      return this.reportsData;
    }
    return this.reportsData.filter((unit) => unit.unitId === unitId);
  }

  // Get available units for dropdown
  get availableUnits(): Unit[] {
    return this.reportsData;
  }

  // Handle unit selection change
  onUnitSelectionChange(unitId: string): void {
    if (unitId === 'all') {
      this.selectedUnitId.set(null);
    } else {
      this.selectedUnitId.set(parseInt(unitId));
    }
  }

  // Print functionality
  async printTable(): Promise<void> {
    try {
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
      title.textContent = 'النموذج المجمع للتقارير';
      title.style.textAlign = 'center';
      title.style.color = '#007bff';
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
        'i, button, .d-print-none'
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
        cellElement.style.textAlign = 'center';
        cellElement.style.verticalAlign = 'top';
      });

      // Style headers
      const headers = tableClone.querySelectorAll('th');
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        headerElement.style.backgroundColor = '#e9ecef';
        headerElement.style.color = '#000';
        headerElement.style.fontWeight = 'bold';
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
      const fileName = `النموذج-المجمع-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  }

  ngOnInit() {
    this.reportsService.getReportsData().subscribe({
      next: (response: IGetReportsResponse) => {
        this.reportsData = response;
        this.reportsData.forEach((unit) => {
          unit.goals.forEach((goal) => {
            goal.initiatives.forEach((initiative) => {
              this.sortProjectsByPriority(initiative);
            });
          });
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching reports data:', error);
        this.reportsData = [];
        this.cdr.detectChanges();
      },
    });
  }

  getRowspan(item: Goal | Initiative): number {
    if ('initiatives' in item) {
      // This is a Goal
      return item.initiatives.reduce(
        (acc: number, initiative: Initiative) =>
          acc + initiative.projects.length,
        0
      );
    } else {
      // This is an Initiative
      return item.projects.length;
    }
  }

  sortProjectsByPriority(initiative: Initiative): void {
    const priorityOrder: Record<string, number> = {
      'أولوية أولى': 1,
      'أولوية ثانية': 2,
      'أولوية ثالثة': 3,
    };

    initiative.projects.sort((a: Project, b: Project) => {
      return (
        (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
      );
    });
  }
}
