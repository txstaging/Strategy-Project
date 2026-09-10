import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { CommentModalComponent } from '../../../../shared/components/comment-form/app-comment-form.component';
import { ObjectiveService } from '../../services/objective.service';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { ApprovalStatusEnum } from '../../../../Core/utilities/consts';

@Component({
  selector: 'app-objectives-stage-details',
  standalone: true,
  imports: [
    CommonModule,
    ActionsAdminComponent,
    CommentModalComponent,
    StatusActionComponent,
  ],
  templateUrl: './objectives-stage-details.component.html',
  styleUrl: './objectives-stage-details.component.css',
})
export class ObjectivesStageDetailsComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = 'معلومات الهدف';
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemActionTaken = new EventEmitter<void>();
  selectedItem: any;
  selectedType: any = null;
  onClose(): void {
    this.closeModal.emit();
  }
  @Input() data: any = {};
  @Input() isAdmin = false;
  @Input() canTakeActionOnItem?: (itemStatus: string) => boolean;
  showStatus = false;
  showCommentModal = false;
  reasonModalType: 'reject' | 'return' | null = null;
  selectedItemId: any = null;

  constructor(
    private objectiveService: ObjectiveService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Add this,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.data.id) {
      // Only process if data exists, has the expected structure, and contains an id
      console.log('Processing data changes in details component:', this.data);
      console.log('Data name:', this.data.name);
      console.log('Data description:', this.data.descripition);
      console.log('Data indicator:', this.data.indicator);

      // Safely process the data structure
      this.data = {
        ...this.data,
        name: this.processFieldData(this.data.name, 'name'),
        descripition: this.processFieldData(
          this.data.descripition,
          'descripition'
        ),
        indicator: this.processFieldData(this.data.indicator, 'indicator'),
      };

      console.log('Processed data:', this.data);
      console.log('Final name object:', this.data.name);
      console.log('Final description object:', this.data.descripition);
      console.log('Final indicator object:', this.data.indicator);
      console.log('Name value:', this.data.name?.value);
      console.log('Description value:', this.data.descripition?.value);
      console.log('Indicator value:', this.data.indicator?.value);
    }
  }

  /**
   * Process field data to ensure consistent structure
   * Handles both object format {value: string, status: string} and simple string format
   */
  private processFieldData(fieldData: any, fieldName: string): any {
    console.log(`Processing field ${fieldName}:`, fieldData);

    if (!fieldData || fieldData === null || fieldData === undefined) {
      console.warn(
        `Field ${fieldName} is null or undefined, creating default object`
      );
      const defaultObj = {
        value: 'غير محدد',
        status: ApprovalStatusEnum.Pending,
      };
      console.log(`Created default object for ${fieldName}:`, defaultObj);
      return defaultObj;
    }

    // If fieldData is a string, convert it to object format
    if (typeof fieldData === 'string') {
      const stringObj = {
        value: fieldData,
        status: ApprovalStatusEnum.Pending,
      };
      return stringObj;
    }

    // If fieldData is already an object with value and status
    if (typeof fieldData === 'object' && fieldData.value !== undefined) {
      const processedObj = {
        ...fieldData,
        status: fieldData.status || ApprovalStatusEnum.Pending,
      };
      return processedObj;
    }

    // Fallback: treat as value if it's neither string nor proper object

    const fallbackObj = {
      value: fieldData ? fieldData.toString() : 'غير محدد',
      status: ApprovalStatusEnum.Pending,
    };
    return fallbackObj;
  }

  handleAccept(item: any, type: string) {
    this.objectiveService.approveGoalItem(this.data.planId, item.id).subscribe({
      next: () => {
        this.data = { ...this.data, [type]: { ...item, status: 'Approved' } };
        this.itemActionTaken.emit();
        this.cdr.detectChanges();
      },
    });
  }

  handleReject(item: any, type: string) {
    this.reasonModalType = 'reject';
    this.selectedItemId = item.id;
    this.selectedItem = item.id;
    this.selectedType = type;
    this.showCommentModal = true;
  }

  handleReturn(item: any, type: string) {
    this.reasonModalType = 'return';
    this.selectedItemId = item.id;
    this.selectedItem = item.id;
    this.selectedType = type;
    this.showCommentModal = true;
  }

  handleCommentSubmit(Comments: string) {
    if (this.reasonModalType === 'reject') {
      this.objectiveService
        .rejectGoalItem(
          this.data.planId,
          this.data.id,
          this.selectedItemId,
          Comments
        )
        .subscribe({
          next: () => {
            this.data = {
              ...this.data,
              [this.selectedType]: { ...this.selectedItem, status: 'Rejected' },
            };
            this.itemActionTaken.emit();
            this.cdr.detectChanges();

            this.showCommentModal = false;
            this.selectedItemId = null;
            this.selectedItem = null;
            this.selectedType = null;
          },
        });
    } else if (this.reasonModalType === 'return') {
      this.objectiveService
        .returnGoalItem(
          this.data.planId,
          this.data.id,
          this.selectedItemId,
          Comments
        )
        .subscribe({
          next: () => {
            this.data = {
              ...this.data,
              [this.selectedType]: {
                ...this.selectedItem,
                status: 'Returned',
              },
            };
            this.itemActionTaken.emit();
            this.cdr.detectChanges();

            this.showCommentModal = false;
            this.selectedItemId = null;
            this.selectedItem = null;
            this.selectedType = null;
          },
        });
    }
  }
}
