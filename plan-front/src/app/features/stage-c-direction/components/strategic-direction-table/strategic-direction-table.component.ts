import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  effect,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { isActionAlreadyTakenByTheCurrentManager } from '../../../../Core/utilities/utils';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { CommentModalComponent } from '../../../../shared/components/comment-form/app-comment-form.component';
import { PopupComponent } from '../../../../shared/components/popup/popup.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { AuthService } from '../../../auth/services/auth.service';
import {
  IAddStrategicDirectionElement,
  StrategicDirectionTypeEnum,
} from '../../../stage-a-strategic-plan/interfaces/iadd-strategic-direction-element';
import { DirectionItemsElement } from '../../interfaces/IGetPlantDirectionResponse';
import { AnalysisStatusService } from '../../services/analysis-status.service';
import { DirectionStatusService } from '../../services/direction-status.service';
import { StrategicDirectionService } from '../../services/strategic-direction.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfService } from '../../../../pdf.service';
import { ApproveAllService } from '../../../../approve-all.service';

@Component({
  selector: 'app-strategic-direction-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    StatusActionComponent,
    ActionsAdminComponent,
    CommentModalComponent,
    PopupComponent,
    RouterLink,
    RouterLinkActive,
    CommonModule,
  ],
  templateUrl: './strategic-direction-table.component.html',
  styleUrl: './strategic-direction-table.component.css',
})
export class StrategicDirectionTableComponent implements OnInit, OnDestroy {
  isFormVisible = signal(false);
  isViewModeEnabled = signal(false);
  currentFormType = '';
  currentFormMode = '';
  data: IAddStrategicDirectionElement[] = [];

  // Services
  private readonly fb = inject(FormBuilder);
  public readonly strategicDirectionService = inject(StrategicDirectionService);
  public readonly directionStatusService = inject(DirectionStatusService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly app = inject(ApproveAllService);
  
  public readonly analysisStatusService = inject(AnalysisStatusService);

  strategicForm: FormGroup;
  directions: any = {
    ['vision']: 'الرؤية',
    ['message']: 'الرسالة',
    ['value']: 'القيم',
  };

  directionHasValue = signal<string[]>([]);
  modalType?: 'view' | 'edit' | 'create';
  isViewModal = signal(false);
  
  isAdmin: boolean;
  detailsList: any;
  commentModal: any = {
    isOpen: false,
    type: null,
    elementId: null,
  };
  currentStatus = signal<any>(null);
  isDirectionApproved = false;
  isSuccessPopupVisible = false;
  showCommentModal = false;
  editSelectedItem: any = null;
  reasonModalType: 'reject' | 'return' | null = null;
  planDirectionId = '';
  // Add this property to make enum available in the template
  StrategicDirectionTypeEnum = StrategicDirectionTypeEnum;

  // Delete confirmation modal properties
  showDeleteConfirmationModal = false;
  itemToDelete: any = null;
  isDeleting = false;

  // Return comment modal properties
  showReturnCommentModal = false;
  selectedReturnItem: any = null;

  // Filter properties
  filters = {
    type: 'all', // all, vision, message, value
    status: 'all', // all, Pending, Approved, Rejected, Returned
    searchText: '',
  };

  // Cached filtered items for better performance
  private filteredItems: Record<string, any[]> = {
    Vision: [],
    Message: [],
    Value: [],
  };

  constructor(private pdfService: PdfService) {
    this.planId = this.route.snapshot.paramMap.get('planId');

    this.strategicForm = this.createForm();
    this.isAdmin = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);

    this.updatePlanDirection();

    // Set planId in the direction status service
    if (this.planId) {
      this.directionStatusService.setPlanId(this.planId);
    }

    // Add effect to track data changes for reactive UI updates
    this.statusChangeEffect = effect(() => {
      const isApproved = this.directionStatusService.isDirectionApproved();
      const analysisComplete =
        this.analysisStatusService.completionPercentage();

      console.log(
        '[StrategicDirectionTableComponent] Status effect triggered:',
        {
          isApproved,
          analysisComplete,
        }
      );

      // Update the form elements status when they're visible
      if (this.isFormVisible() || this.isViewModal()) {
        this.updateFormElementsStatus();
      }

      // Force UI refresh
      this.cdr.detectChanges();
    });
  }

  private statusChangeEffect: any;
  ngOnInit(): void {
    this.updatePlanDirection();
   const planIdParam = this.route.snapshot.paramMap.get('planId');

  if (!planIdParam) {
    return; // أو error / redirect
  }

 
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('click', this.handleClickOutsideView.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    document.removeEventListener(
      'click',
      this.handleClickOutsideView.bind(this)
    );

    // Cleanup our status effect
    if (this.statusChangeEffect) {
      this.statusChangeEffect.destroy();
    }
  }

  IsAnalysis: boolean | null = null;
  planId: string | null = null;

  private createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      name: ['', Validators.required],
      comment: [''],
      directionItemsElements: this.fb.array([this.createElementGroup()]),
    });
  }

  private createElementGroup(): FormGroup {
    return this.fb.group({
      id: [null],
      name: ['', Validators.required],
      comment: [''],
      status: ['Pending'],
    });
  }

  onSubmit(): void {
    this.strategicForm.markAllAsTouched();

    if (this.strategicForm.valid) {
      // Get elements from form array - include ALL elements (existing and new)
      const elements = this.directionItemsElements.value.map(
        (element: any) => ({
          id: element.id || null, // Keep existing ID or null for new elements
          name: element.name,
          comment: element.comment || '',
          status: element.status || 'Pending',
        })
      );

      // For edit mode, get the current item ID from the form
      const itemId =
        this.modalType === 'edit' ? this.strategicForm.get('id')?.value : null;

      // Prepare the request body exactly as required by the API
      const requestBody = {
        id:
          this.modalType === 'create'
            ? Number(this.planId)
            : itemId || Number(this.planId),
        name: this.strategicForm.get('name')?.value || '',
        type: this.currentFormType,
        comment: this.strategicForm.get('comment')?.value || '',
        directionItemsElements: elements, // Send ALL elements (existing + new + modified)
      };

      console.log('[onSubmit] Submitting request body:', requestBody);
      console.log('[onSubmit] Modal type:', this.modalType);
      console.log('[onSubmit] Elements count:', elements.length);

      // Call appropriate API based on operation type
      const apiCall =
        this.modalType === 'create'
          ? this.strategicDirectionService.createDirectionItem(
              this.planId!,
              requestBody
            )
          : this.strategicDirectionService.updateDirectionItem(
              this.planId!,
              requestBody
            );

      apiCall.subscribe({
        next: () => {
          this.isFormVisible.set(false);
          this.strategicForm.reset();
          // Refresh the direction list
          this.updatePlanDirection();

          // Notify direction status service of changes
          this.directionStatusService.directionItemStatusChanged();
        },
        error: (error: any) => {
          console.error(
            `Error ${this.modalType === 'create' ? 'creating' : 'updating'} item:`,
            error
          );
        },
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.strategicForm);
    }
  }

  // Helper method to mark all controls in a form group as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      // If it's a FormGroup, recursively mark its controls as touched
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onDelete(itemId: string): void {
    if (this.isDeleting || !this.planId) return;

    this.isDeleting = true;

    // Use the proper delete API
    this.strategicDirectionService
      .deleteDirectionItem(this.planId, itemId)
      .subscribe({
        next: () => {
          // Refresh the direction data
          this.updatePlanDirection();

          // Notify direction status service of changes
          this.directionStatusService.directionItemStatusChanged();

          this.closeDeleteConfirmationModal();
          this.isDeleting = false;
        },
        error: (error) => {
          console.error('Error deleting direction item:', error);
          this.closeDeleteConfirmationModal();
          this.isDeleting = false;
        },
      });
  }

  // Delete confirmation modal methods
  showDeleteConfirmation(item: any) {
    if (!item || !item.id) {
      console.error(
        '[StrategicDirectionTable] Cannot delete item: missing ID',
        item
      );
      return;
    }
    this.itemToDelete = item;
    this.showDeleteConfirmationModal = true;
  }

  closeDeleteConfirmationModal() {
    this.showDeleteConfirmationModal = false;
    this.itemToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete() {
    if (this.itemToDelete && !this.isDeleting) {
      this.editSelectedItem = this.itemToDelete;
      // Use the item ID for deletion
      const itemId = this.itemToDelete.id;
      if (itemId) {
        this.onDelete(itemId.toString());
      } else {
        console.error('No item ID found for deletion');
        this.closeDeleteConfirmationModal();
      }
    }
  }

  // Handle popup option selection (view, edit, delete)
  handleOptionSelected(option: any): void {
    this.editSelectedItem = option.item;

    // Convert type to lowercase for case-insensitive comparison
    const optionType = option.type.toLowerCase();

    switch (optionType) {
      case 'view':
        this.togglePopupView(option.item.type || 'Vision', option.item.id);
        break;
      case 'edit':
        this.togglePopup(option.item.type || 'Vision', 'edit', option.item.id);
        break;
      case 'delete':
        this.showDeleteConfirmation(option.item);
        break;
    }
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  isActionAlreadyTakenByTheCurrentManager(status: string) {
    const userRole = this.authService.getUserRole();
    return isActionAlreadyTakenByTheCurrentManager(status, userRole!);
  }

  onAcceptItem(elementId: any,flag:boolean) {
    if (!this.planId) return;

    // Get appropriate status based on user role
    const userRole = this.authService.getUserRole();
    let newStatus: string;

    if (userRole === RolesEnums.UnitManager) {
      newStatus = ApprovalStatusEnum.ApprovedByUnitManager;
    } else if (userRole === RolesEnums.RegionManager) {
      newStatus = ApprovalStatusEnum.ApprovedByRegionManager;
    } else {
      newStatus = ApprovalStatusEnum.ApprovedByHighManagement;
    }

    // Determine if this is an item-level or element-level operation
    const isMainItem = this.isMainDirectionItem(elementId);

    let apiCall;
    if (flag) {
      // Use item-level API for main direction items
      console.log(
        `[StrategicDirectionTable] Approving direction ITEM with ID: ${elementId}`
      );

      // Update only the main item status, NOT its elements
      this.updateMainItemStatus(elementId, newStatus);

      apiCall = this.strategicDirectionService.approveDirectionItem(
        this.planId,
        elementId
      );
    } else {
      // Use element-level API for sub-elements
      console.log(
        `[StrategicDirectionTable] Approving direction ELEMENT with ID: ${elementId}`
      );

      // Update only the specific element status
      this.analysisStatusService.updatePointStatus(elementId, newStatus);

      apiCall = this.strategicDirectionService.approveDirectionElement(
        this.planId,
        elementId
      );
    }

    // Make the API call
    apiCall.subscribe({
      next: () => {
        // Show success feedback
        this.showSuccessPopup();

        // Refresh the direction list to get updated statuses
        this.updatePlanDirection();

        // Notify direction status service of changes
        this.directionStatusService.directionItemStatusChanged();

        // Force change detection
        this.cdr.detectChanges();
        
      },
      error: (error) => {
        console.error('Error approving item/element:', error);
        // In case of error, refresh to get the correct state
        this.updatePlanDirection();
      },
    });
  }

  /**
   * Update only the main item status without affecting its elements
   */
  updateMainItemStatus(itemId: any, newStatus: string): void {
    if (!this.detailsList || !Array.isArray(this.detailsList)) {
      return;
    }

    // Find and update only the main item
    this.detailsList = this.detailsList.map((item) => {
      if (item.id == itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    // Force UI update
    this.cdr.detectChanges();
  }

  /**
   * Find parent item that contains the specified element ID
   */
  findParentItemByElementId(elementId: string | number): any {
    if (!this.detailsList || !Array.isArray(this.detailsList)) {
      return null;
    }

    for (const item of this.detailsList) {
      // Check directionItemsElements property
      if (
        item.directionItemsElements &&
        Array.isArray(item.directionItemsElements)
      ) {
        const foundElement = item.directionItemsElements.find(
          (el: any) => el.id == elementId
        );
        if (foundElement) {
          return item;
        }
      }

      // Check elements property
      if (item.elements && Array.isArray(item.elements)) {
        const foundElement = item.elements.find(
          (el: any) => el.id == elementId
        );
        if (foundElement) {
          return item;
        }
      }
    }

    return null;
  }

  /**
   * Update the form's elements to reflect current status changes
   */
  updateFormElementsStatus(): void {
    // Skip if form is not initialized
    if (!this.strategicForm || !this.directionItemsElements) return;

    for (const element of this.directionItemsElements.controls) {
      const elementId = element.get('id')?.value;

      // Skip elements without an ID
      if (!elementId) continue;

      // Find the current status of this element from detailsList
      const parentItem = this.findParentItemByElementId(elementId);
      if (parentItem) {
        const elementData = this.findElementInItem(parentItem, elementId);
        if (elementData && elementData.status) {
          // Update status in the form
          element.get('status')?.setValue(elementData.status);
        }
      }
    }
  }

  /**
   * Find an element in a parent item by its ID
   */
  findElementInItem(parentItem: any, elementId: any): any {
    if (
      parentItem.directionItemsElements &&
      Array.isArray(parentItem.directionItemsElements)
    ) {
      return parentItem.directionItemsElements.find(
        (el: any) => el.id == elementId
      );
    }

    if (parentItem.elements && Array.isArray(parentItem.elements)) {
      return parentItem.elements.find((el: any) => el.id == elementId);
    }

    return null;
  }

  /**
   * Determine if the given ID corresponds to a main direction item or a sub-element
   * @param id The ID to check
   * @returns true if it's a main direction item, false if it's a sub-element
   */
  isMainDirectionItem(id: any): boolean {
    if (!this.detailsList || !Array.isArray(this.detailsList)) {
      return false;
    }

    // Check if the ID matches any main direction item
    const isMainItem = this.detailsList.some((item) => item.id == id);

    if (isMainItem) {
      return true;
    }

    // Check if the ID matches any sub-element
    for (const item of this.detailsList) {
      if (
        item.directionItemsElements &&
        Array.isArray(item.directionItemsElements)
      ) {
        const isSubElement = item.directionItemsElements.some(
          (el: any) => el.id == id
        );
        if (isSubElement) {
          return false;
        }
      }

      if (item.elements && Array.isArray(item.elements)) {
        const isSubElement = item.elements.some((el: any) => el.id == id);
        if (isSubElement) {
          return false;
        }
      }
    }
    return false;
  }

  handleElementAccept(itemId: number) {
    if (!this.planId) return;

    // Set status based on user role for immediate UI update
    const userRole = this.authService.getUserRole();
    let newStatus: ApprovalStatusEnum;

    if (userRole === RolesEnums.UnitManager) {
      newStatus = ApprovalStatusEnum.ApprovedByUnitManager;
    } else if (userRole === RolesEnums.RegionManager) {
      newStatus = ApprovalStatusEnum.ApprovedByRegionManager;
    } else if (userRole === RolesEnums.HighManagement) {
      newStatus = ApprovalStatusEnum.ApprovedByHighManagement;
    } else {
      newStatus = ApprovalStatusEnum.Pending;
    }

    // Find the item by its ID across all types
    let item: any = null;

    // Search for the item in all direction types
    const visionItems = this.getDirectionItemsByType('Vision');
    const messageItems = this.getDirectionItemsByType('Message');
    const valueItems = this.getDirectionItemsByType('Value');

    if (visionItems.some((i) => i.id === itemId)) {
      item = visionItems.find((i) => i.id === itemId);
    } else if (messageItems.some((i) => i.id === itemId)) {
      item = messageItems.find((i) => i.id === itemId);
    } else if (valueItems.some((i) => i.id === itemId)) {
      item = valueItems.find((i) => i.id === itemId);
    }

    if (!item) {
      console.error(`Item with ID ${itemId} not found in any direction type`);
      return;
    }

    // First update the status of the main item
    item.status = newStatus;

    // For each element in the directionItemsElements array, update the status
    if (
      item.directionItemsElements &&
      Array.isArray(item.directionItemsElements)
    ) {
      item.directionItemsElements.forEach((element: DirectionItemsElement) => {
        if (element.id) {
          // Update element status in UI
          element.status = newStatus;
          // Update analysis service
          this.analysisStatusService.updatePointStatus(element.id, newStatus);
        }
      });
    }

    // Make API call with the item ID (not the type)
    this.strategicDirectionService
      .approveDirectionItem(this.planId, itemId.toString())
      .subscribe({
        next: () => {
          // Show success feedback
          this.showSuccessPopup();

          // Update form element statuses
          this.updateFormElementsStatus();

          // Force refresh analysis to update UI
          this.analysisStatusService.refreshAnalysis();

          // Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error approving item:', err);
          // In case of error, refresh to get actual state
          this.updatePlanDirection();
        },
      });
  }

  handleElementReject(itemId: number) {
    this.showCommentModal = true;
    this.editSelectedItem = itemId;
    this.reasonModalType = 'reject';
  }

  handleElementReturn(itemId: number) {
    this.showCommentModal = true;
    this.editSelectedItem = itemId;
    this.reasonModalType = 'return';
  }

  getStrategicDirection(directionType: StrategicDirectionTypeEnum) {
    if (this.planId) {
      this.strategicDirectionService
        .getDirectionItemById(this.planId, directionType)
        .subscribe({
          next: (response) => {
            if (!response || !response.data) {
              return;
            }

            // Check if we have the new response structure with getAllDirectionDtoResponse
            const data = response.data;

            // Handle different response structures
            if (data.getAllDirectionDtoResponse) {
              // New structure with getAllDirectionDtoResponse
              let items: any[] = [];

              if (directionType === StrategicDirectionTypeEnum.Vision) {
                items = data.getAllDirectionDtoResponse.vision || [];
              } else if (directionType === StrategicDirectionTypeEnum.Message) {
                items = data.getAllDirectionDtoResponse.message || [];
              } else if (directionType === StrategicDirectionTypeEnum.Value) {
                items = data.getAllDirectionDtoResponse.value || [];
              }

              // Update directionHasValue if we have items
              if (items.length > 0) {
                this.directionHasValue.update((prev: string[]) => {
                  if (!prev.includes(directionType)) {
                    return [...prev, directionType];
                  }
                  return prev;
                });
              }

              // Reset and rebuild form for the first item (or create new if none)
              this.strategicForm.patchValue({
                name: '',
                comment: '',
              });

              // Reset elements array
              while (this.directionItemsElements.length) {
                this.directionItemsElements.removeAt(0);
              }

              // If we have items, populate elements from the first one
              if (items.length > 0) {
                const firstItem = items[0];
                const elements = firstItem.directionItemsElements || [];

                // Add each element to form array
                elements.forEach((element: any) => {
                  this.directionItemsElements.push(
                    this.fb.group({
                      id: [element.id],
                      name: [element.value, Validators.required], // Using 'value' field
                      comment: [''],
                      status: [element.status],
                    })
                  );
                });
              } else {
                // Add at least one empty element if none exist
                this.directionItemsElements.push(this.createElementGroup());
              }
            } else if (data.name) {
              // Old structure with direct properties
              this.strategicForm.patchValue({
                name: data.name,
                comment: data.comment,
              });

              while (this.directionItemsElements.length) {
                this.directionItemsElements.removeAt(0);
              }

              if (
                data.directionItemsElements &&
                Array.isArray(data.directionItemsElements)
              ) {
                data.directionItemsElements.forEach((element: any) => {
                  this.directionItemsElements.push(
                    this.fb.group({
                      id: [element.id],
                      name: [element.name, Validators.required],
                      comment: [element.comment],
                      status: [element.status],
                    })
                  );
                });
              }
            }

            this.cdr.detectChanges();
          },
        });
    }
  }

  addElement(): void {
    const elements = this.strategicForm.get(
      'directionItemsElements'
    ) as FormArray;
    elements.push(this.createElementGroup());
  }

  removeElement(): void {
    const elements = this.strategicForm.get(
      'directionItemsElements'
    ) as FormArray;
    if (elements.length > 0) {
      elements.removeAt(elements.length - 1);
    }
  }

  get directionItemsElements(): FormArray {
    return this.strategicForm.get('directionItemsElements') as FormArray;
  }

  /**
   * Force reload data and refresh filters
   */
  reloadData(): void {
    // Clear cache
    this.filteredItems = {
      Vision: [],
      Message: [],
      Value: [],
    };

    // Reload data
    this.updatePlanDirection();

    // Reset filters
    this.resetFilters();

    // Force UI update
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 500);
  }

  /**
   * Returns direction items filtered by type (Vision, Message, Value)
   * @param type The direction type to filter by
   */
  getDirectionItemsByType(type: string): any[] {
    if (!this.detailsList) {
      return [];
    }

    // If detailsList is an array, filter it
    if (Array.isArray(this.detailsList)) {
      const items = this.detailsList.filter((item) => {
        if (!item) return false;

        // Handle both string and enum types
        if (typeof item.type === 'string') {
          const itemType = item.type.toLowerCase();
          const searchType = type.toLowerCase();
          const matches = itemType === searchType;
          return matches;
        }
        return false;
      });

      return items;
    } else {
      console.warn('detailsList is not an array');
    }

    return [];
  }

  /**
   * Check if there are any direction items
   */
  hasAnyDirectionItems(): boolean {
    if (!this.detailsList) return false;

    if (Array.isArray(this.detailsList)) {
      return this.detailsList.length > 0;
    }

    return false;
  }

  /**
   * Safely convert string type to enum
   * @param typeString String representation of direction type
   */
  getTypeEnum(typeString: string): StrategicDirectionTypeEnum {
    switch (typeString.toLowerCase()) {
      case 'vision':
        return StrategicDirectionTypeEnum.Vision;
      case 'message':
        return StrategicDirectionTypeEnum.Message;
      case 'value':
        return StrategicDirectionTypeEnum.Value;
      default:
        return StrategicDirectionTypeEnum.Vision; // Default fallback
    }
  }

  /**
   * Toggle popup with proper type conversion
   */
  togglePopup(
    type: string | StrategicDirectionTypeEnum,
    modalType?: 'view' | 'edit' | 'create',
    itemId?: string
  ): void {
    // Convert string to enum if needed
    const typeEnum = typeof type === 'string' ? this.getTypeEnum(type) : type;

    if (modalType) this.modalType = modalType;
    if (modalType === 'view') this.isViewModal.set(true);
    this.currentFormType = typeEnum;
    this.isFormVisible.update((prev) => !prev);

    if (this.isFormVisible()) {
      if (modalType === 'create') {
        // For create mode, reset the form instead of fetching data
        this.strategicForm.reset();
        // Initialize with empty elements
        while (this.directionItemsElements.length) {
          this.directionItemsElements.removeAt(0);
        }
        // Add one empty element to start with
        this.directionItemsElements.push(this.createElementGroup());
      } else if (itemId && modalType === 'edit') {
        // If editing a specific item, get it by ID
        this.getDirectionItemById(itemId);
      } else {
        // Otherwise get all items of the selected type
        this.getStrategicDirection(typeEnum);
      }
    }

    if (!this.isFormVisible()) {
      this.strategicForm.reset();
    }
  }

  /**
   * Toggle popup view with proper type conversion and update statuses
   */
  togglePopupView(
    type: string | StrategicDirectionTypeEnum,
    itemId?: string
  ): void {
    // Convert string to enum if needed
    const typeEnum = typeof type === 'string' ? this.getTypeEnum(type) : type;

    this.currentFormType = typeEnum;
    this.isViewModal.update((prev) => !prev);

    if (this.isViewModal()) {
      if (itemId) {
        this.getDirectionItemById(itemId);
      } else {
        this.getStrategicDirection(typeEnum);
      }
    }

    if (!this.isViewModal()) {
      this.strategicForm.reset();
    }

    // Update element statuses immediately
    setTimeout(() => {
      this.updateFormElementsStatus();
      this.cdr.detectChanges();
    }, 0);
  }

  getFormTitle(): string {
    const titles = {
      [StrategicDirectionTypeEnum.Vision]: 'الرؤية',
      [StrategicDirectionTypeEnum.Value]: 'القيم',
      [StrategicDirectionTypeEnum.Message]: 'الرسالة',
    };
    return titles[this.currentFormType as keyof typeof titles];
  }

  get elements(): FormArray {
    return this.strategicForm.get('elements') as FormArray;
  }

  updatePlanDirection(): void {
    if (!this.planId) return;
    this.strategicDirectionService.getPlanDirection(this.planId).subscribe({
      next: (response) => {
        if (!response || !response.data) {
          return;
        }

        const { status } = response.data;

        this.isDirectionApproved =
          status === ApprovalStatusEnum.ApprovedByHighManagement;

        // Store the direction ID for approval
        if (response.data.id) {
          this.planDirectionId = response.data.id.toString();
        }

        // Initialize directionHasValue signal
        this.directionHasValue.set([]);

        // Handle the new response structure with getAllDirectionDtoResponse
        if (response.data.getAllDirectionDtoResponse) {
          // Get all items for each direction type
          const visionItems =
            response.data.getAllDirectionDtoResponse.vision || [];
          const messageItems =
            response.data.getAllDirectionDtoResponse.message || [];
          const valueItems =
            response.data.getAllDirectionDtoResponse.value || [];

          // Update directionHasValue signal
          if (visionItems.length > 0) {
            this.directionHasValue.update((prev) => [...prev, 'vision']);
          }
          if (messageItems.length > 0) {
            this.directionHasValue.update((prev) => [...prev, 'message']);
          }
          if (valueItems.length > 0) {
            this.directionHasValue.update((prev) => [...prev, 'value']);
          }

          // Create detailsList with all items for each type
          this.detailsList = [];

          // Add vision items
          visionItems.forEach((item: any) => {
            this.detailsList.push({
              type: 'Vision',
              id: item.id,
              content: '', // No content at this level in the new structure
              name: item.name || '',
              status: item.status || response.data.status || 'Pending',
              comment: item.comment || '',
              elements: item.directionItemsElements || [],
              directionItemsElements: item.directionItemsElements || [], // Preserve original structure
            });
          });

          // Add message items
          messageItems.forEach((item: any) => {
            this.detailsList.push({
              type: 'Message',
              id: item.id,
              content: '', // No content at this level in the new structure
              name: item.name || '',
              status: item.status || response.data.status || 'Pending',
              comment: item.comment || '',
              elements: item.directionItemsElements || [],
              directionItemsElements: item.directionItemsElements || [], // Preserve original structure
            });
          });

          // Add value items
          valueItems.forEach((item: any) => {
            this.detailsList.push({
              type: 'Value',
              id: item.id,
              content: '', // No content at this level in the new structure
              name: item.name || '',
              status: item.status || response.data.status || 'Pending',
              comment: item.comment || '',
              elements: item.directionItemsElements || [],
              directionItemsElements: item.directionItemsElements || [], // Preserve original structure
            });
          });
        } else if (response.data.items) {
          // Handle the existing logic for populated items
          Object.entries(response.data.items).forEach(
            ([type, data]: [string, any]) => {
              const formValue = {
                name: data.content,
                comment: '',
                directionItemsElements: data.elements.map((element: any) => ({
                  id: element.id,
                  name: element.name,
                  comment: element.comment,
                  status: element.status,
                })),
              };

              if (data.content) {
                this.directionHasValue.update((prev: string[]) => [
                  ...prev,
                  type,
                ]);
              }

              // Update form when matching current type
              if (type === this.currentFormType) {
                this.strategicForm.patchValue(formValue);

                // Reset and rebuild elements form array
                while (this.directionItemsElements.length) {
                  this.directionItemsElements.removeAt(0);
                }

                formValue.directionItemsElements.forEach((element: any) => {
                  this.directionItemsElements.push(
                    this.fb.group({
                      id: [element.id],
                      name: [element.name, Validators.required],
                      comment: [element.comment],
                      status: [element.status],
                    })
                  );
                });
              }
            }
          );

          this.detailsList = Object.entries(response.data.items).map(
            ([type, data]: [string, any]) => ({
              type: type,
              id: data.id,
              content: data.content,
              name: data.name || data.content,
              status: data.status,
              comment: data.comment || '',
              elements: data.elements,
            })
          );
        } else {
          // Fallback if neither structure is present
          this.detailsList = [
            {
              type: 'Vision',
              content: '',
              name: '',
              status: 'Pending',
              comment: '',
              elements: [],
            },
            {
              type: 'Message',
              content: '',
              name: '',
              status: 'Pending',
              comment: '',
              elements: [],
            },
            {
              type: 'Value',
              content: '',
              name: '',
              status: 'Pending',
              comment: '',
              elements: [],
            },
          ];
        }

        // Reset filters when data is updated - defer to avoid change detection conflicts
        setTimeout(() => {
          this.applyFilters();
        }, 0);
      },
    });
  }

  openCommentModal(type: string, elementId: string) {
    this.commentModal = {
      isOpen: true,
      type,
      elementId,
    };
  }

  closeCommentModal() {
    this.commentModal = {
      isOpen: false,
      type: null,
      elementId: null,
    };
    // No need for manual change detection - Angular handles this automatically
  }

  onRejectItem(elementId: string, comment: string) {
    if (!this.planId) return;

    // Get appropriate status based on user role
    const userRole = this.authService.getUserRole();
    let newStatus: string;

    if (userRole === RolesEnums.UnitManager) {
      newStatus = ApprovalStatusEnum.RejectedByUnitManager;
    } else if (userRole === RolesEnums.RegionManager) {
      newStatus = ApprovalStatusEnum.RejectedByRegionManager;
    } else {
      newStatus = ApprovalStatusEnum.RejectedByHighManagement;
    }

    // Determine if this is an item-level or element-level operation
    const isMainItem = this.isMainDirectionItem(elementId);

    // Update UI immediately
    if (isMainItem) {
      this.updateMainItemStatus(elementId, newStatus);
    } else {
      this.analysisStatusService.updatePointStatus(elementId, newStatus);
    }

    let apiCall;
    if (isMainItem) {
      // Use item-level API for main direction items
      apiCall = this.strategicDirectionService.rejectDirectionItem(
        this.planId,
        elementId,
        comment
      );
    } else {
      // Use element-level API for sub-elements
      apiCall = this.strategicDirectionService.rejectDirectionElement(
        this.planId,
        elementId,
        comment
      );
    }

    // Then make the API call
    apiCall.subscribe({
      next: () => {
        // Refresh the direction list to get updated statuses
        this.updatePlanDirection();

        // Notify direction status service of changes
        this.directionStatusService.directionItemStatusChanged();

        this.closeCommentModal();
      },
      error: (error) => {
        console.error('Error rejecting item/element:', error);
        // In case of error, get the actual state
        this.updatePlanDirection();
      },
    });
  }

  onReturnItem(elementId: string, comment: string) {
    if (!this.planId) return;

    // Get appropriate status based on user role
    const userRole = this.authService.getUserRole();
    let newStatus: string;

    if (userRole === RolesEnums.UnitManager) {
      newStatus = ApprovalStatusEnum.ReturnedByUnitManager;
    } else if (userRole === RolesEnums.RegionManager) {
      newStatus = ApprovalStatusEnum.ReturnedByRegionManager;
    } else {
      newStatus = ApprovalStatusEnum.ReturnedByHighManagement;
    }

    // Determine if this is an item-level or element-level operation
    const isMainItem = this.isMainDirectionItem(elementId);

    // Update UI immediately
    if (isMainItem) {
      this.updateMainItemStatus(elementId, newStatus);
    } else {
      this.analysisStatusService.updatePointStatus(elementId, newStatus);
    }

    let apiCall;
    if (isMainItem) {
      // Use item-level API for main direction items
      apiCall = this.strategicDirectionService.returnDirectionItem(
        this.planId,
        elementId,
        comment
      );
    } else {
      // Use element-level API for sub-elements
      apiCall = this.strategicDirectionService.returnDirectionElement(
        this.planId,
        elementId,
        comment
      );
    }

    // Then make the API call
    apiCall.subscribe({
      next: () => {
        // Refresh the direction list to get updated statuses
        this.updatePlanDirection();

        // Notify direction status service of changes
        this.directionStatusService.directionItemStatusChanged();

        this.closeCommentModal();
      },
      error: (error) => {
        console.error('Error returning item/element:', error);
        // In case of error, get the actual state
        this.updatePlanDirection();
      },
    });
  }

  handleOnComment(comment: string, elementId: string, type: string) {
    if (type === 'reject') {
      // onRejectItem now handles both UI update and API call
      this.onRejectItem(elementId, comment);
    } else if (type === 'return') {
      // onReturnItem now handles both UI update and API call
      this.onReturnItem(elementId, comment);
    }
  }

  private handleClickOutside(event: MouseEvent): void {
    const formContainer = document.querySelector('.form-container');
    const overlay = document.querySelector('.popup-overlay');
    if (
      this.isFormVisible() &&
      formContainer &&
      overlay &&
      !formContainer.contains(event.target as Node) &&
      overlay.contains(event.target as Node)
    ) {
      this.togglePopup(this.currentFormType);
    }
  }

  private handleClickOutsideView(event: MouseEvent): void {
    const viewContainer = document.querySelector('.view-container');
    const overlay = document.querySelector('.popup-overlay');
    if (
      this.isViewModal() &&
      viewContainer &&
      overlay &&
      !viewContainer.contains(event.target as Node) &&
      overlay.contains(event.target as Node)
    ) {
      this.togglePopupView(this.currentFormType);
    }
  }

  handleRestore(reason: string) {
    if (!this.editSelectedItem || !this.planId || !this.reasonModalType) {
      return;
    }

    const itemId = this.editSelectedItem;

    let operation;
    switch (this.reasonModalType) {
      case 'reject':
        operation = this.strategicDirectionService.rejectDirectionItem(
          this.planId,
          itemId.toString(),
          reason
        );
        break;
      case 'return':
        operation = this.strategicDirectionService.returnDirectionItem(
          this.planId,
          itemId.toString(),
          reason
        );
        break;
      default:
        return;
    }

    operation.subscribe({
      next: () => {
        this.updatePlanDirection();
        this.showCommentModal = false;
        this.editSelectedItem = null;
        this.reasonModalType = null;
      },
      error: (error) => {
        console.error('Error performing operation:', error);
      },
    });
  }

  /**
   * Check if user can edit a direction item
   * Unit employees can edit items that are:
   * 1. In Pending status
   * 2. Have been returned by Region Manager or High Management
   * (Cannot edit rejected points)
   * @param item Direction item to check
   */
  canEditItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can edit
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Editable while the item is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const isDraft = item.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(item.status);
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  /**
   * Check if user can delete a direction item
   * Unit employees can delete any pending items
   * @param item Direction item to check
   */
  canDeleteItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can delete items
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Deletable while the item is not yet approved at any level (same rule as edit).
    const isDraft = item.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(item.status);
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  /**
   * Check if user can edit or delete any direction item (for showing popup menu)
   * @param item Direction item to check
   */
  canEditOrDeleteItem(item: any): boolean {
    return this.canEditItem(item) || this.canDeleteItem(item);
  }

  /**
   * Check if user can take action on an item
   * According to workflow:
   * - Unit Employees add points
   * - Unit Managers approve/reject/return items at stage level
   * - Region Managers can approve/reject/return individual items after Unit Manager approves
   * - High Management can approve/reject/return items approved by Region Manager
   * @param status Current status of the item
   */
  canTakeAction(status: string): boolean {
    if (!status) return false;
    const userRole = this.authService.getUserRole();

    if (!userRole) return false;

    // Don't show admin actions for returned items until they're edited by unit employee
    if (this.isReturnedItem(status)) {
      return false;
    }

    let canTake = false;

    // Explicitly check for the 'Pending' status which means initial state
    if (status === 'Pending') {
      // Only Unit Manager can take actions on 'Pending' status
      canTake = userRole === RolesEnums.UnitManager;
    }
    // Unit Manager can take actions on items in Pending status
    else if (userRole === RolesEnums.UnitManager) {
      canTake = status === ApprovalStatusEnum.Pending;
    }
    // Region Manager can take action on items approved by Unit Manager
    else if (userRole === RolesEnums.RegionManager) {
      canTake =
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;
    }
    // High Management can take action on items approved by Region Manager
    else if (userRole === RolesEnums.HighManagement) {
      canTake =
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially;
    }
    return canTake;
  }

  /**
   * Check if an item has returned status
   * @param status Current status of the item
   */
  isReturnedItem(status: string): boolean {
    return ReturnedStatuses.includes(status as ApprovalStatusEnum);
  }

  /**
   * Get returned item message for current user role
   * @param status Current status of the item
   */
  getReturnedItemMessage(status: string): string {
    const userRole = this.authService.getUserRole();

    if (status === ApprovalStatusEnum.ReturnedByUnitManager) {
      if (userRole === RolesEnums.UnitEmployee) {
        return 'تم إرجاع هذا العنصر من مدير الوحدة - يرجى تعديله';
      } else {
        return 'تم إرجاع هذا العنصر - في انتظار تعديل الموظف';
      }
    } else if (status === ApprovalStatusEnum.ReturnedByRegionManager) {
      if (userRole === RolesEnums.UnitEmployee) {
        return 'تم إرجاع هذا العنصر من مدير المنطقة - يرجى تعديله';
      } else {
        return 'تم إرجاع هذا العنصر - في انتظار تعديل الموظف';
      }
    } else if (status === ApprovalStatusEnum.ReturnedByHighManagement) {
      if (userRole === RolesEnums.UnitEmployee) {
        return 'تم إرجاع هذا العنصر من الإدارة العليا - يرجى تعديله';
      } else {
        return 'تم إرجاع هذا العنصر - في انتظار تعديل الموظف';
      }
    }

    return '';
  }

  /**
   * Get the return reason/comment for display
   * @param comment The comment from the API
   */
  getReturnReasonText(comment: string): string {
    return comment && comment.trim() ? comment : 'لم يتم تقديم سبب الإرجاع';
  }

  // Return comment modal methods
  openReturnCommentModal(item: any): void {
    this.selectedReturnItem = item;
    this.showReturnCommentModal = true;
  }

  closeReturnCommentModal(): void {
    this.showReturnCommentModal = false;
    this.selectedReturnItem = null;
  }

  // Add this new method to get a specific item by ID
  getDirectionItemById(itemId: string): void {
    if (!this.planId || !itemId) return;

    this.strategicDirectionService
      .getDirectionItemById(this.planId, itemId)
      .subscribe({
        next: (response) => {
          if (!response || !response.data) {
            return;
          }

          const item = response.data;

          // Update form with item data
          this.strategicForm.patchValue({
            id: item.id,
            name: item.name || '',
            comment: item.comment || '',
          });

          // Reset and rebuild elements form array
          while (this.directionItemsElements.length) {
            this.directionItemsElements.removeAt(0);
          }

          // Add elements from the item
          if (
            item.directionItemsElements &&
            Array.isArray(item.directionItemsElements)
          ) {
            item.directionItemsElements.forEach((element: any) => {
              this.directionItemsElements.push(
                this.fb.group({
                  id: [element.id],
                  name: [element.name, Validators.required],
                  comment: [element.comment || ''],
                  status: [element.status],
                })
              );
            });
          } else {
            // Add at least one empty element if none exist
            this.directionItemsElements.push(this.createElementGroup());
          }

          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Check if the current user can add new items
   * All authenticated users can add new items
   * @returns boolean indicating if the user can add items
   */
  canAddItems(): boolean {
    const userRole = this.authService.getUserRole();
    // Allow all authenticated users to add items
    return userRole !== null && userRole !== undefined;
  }

  /**
   * Get filter value based on display name
   */
  getFilterTypeValue(displayType: string): string {
    switch (displayType) {
      case 'الرؤية':
        return 'vision';
      case 'الرسالة':
        return 'message';
      case 'القيم':
        return 'value';
      default:
        return 'all';
    }
  }

  /**
   * Set type filter and apply filters
   */
  setTypeFilter(type: string): void {
    this.filters.type = type;
    this.applyFilters();
  }

  /**
   * Apply all filters and refresh view
   */
  applyFilters(): void {
    // Clear cached filtered items
    this.filteredItems = {
      Vision: [],
      Message: [],
      Value: [],
    };

    this.cdr.detectChanges();
  }

  /**
   * Reset all filters to default values
   */
  resetFilters(): void {
    console.log('Resetting filters');
    this.filters = {
      type: 'all',
      status: 'all',
      searchText: '',
    };

    this.applyFilters();
  }

  /**
   * Returns direction items filtered by type and additional filters
   * @param type The direction type to filter by
   */
  getFilteredDirectionItems(type: string): any[] {
    // Return cached results if available
    if (this.filteredItems[type] && this.filteredItems[type].length > 0) {
      return this.filteredItems[type];
    }
    // Get base items by type - first filter by type if we have a valid detailsList
    let items: any[] = [];
    if (this.detailsList && Array.isArray(this.detailsList)) {
      items = this.detailsList.filter((item) => {
        if (typeof item.type === 'string') {
          return item.type.toLowerCase() === type.toLowerCase();
        }
        return false;
      });
    }

    // If global type filter is applied and not 'all', filter out items not matching
    if (this.filters.type !== 'all') {
      const mappedType = this.mapTypeToApiType(this.filters.type);
      if (mappedType.toLowerCase() !== type.toLowerCase()) {
        return []; // Return empty array if this type doesn't match the filter
      }
    }

    // Apply status filter if not 'all'
    if (this.filters.status !== 'all') {
      const statusFilter = this.filters.status.toLowerCase();
      items = items.filter((item) => {
        // Check main item status
        const mainMatch = item.status && item.status.toLowerCase().includes(statusFilter);
        // Check sub-elements status
        const elements = item.elements || item.directionItemsElements || [];
        const subMatch = elements.some(
          (el: any) => el.status && el.status.toLowerCase().includes(statusFilter)
        );
        return mainMatch || subMatch;
      });
    }

    // Apply text search if provided
    if (this.filters.searchText && this.filters.searchText.trim() !== '') {
      const searchTerm = this.filters.searchText.toLowerCase();
      items = items.filter((item) => {
        // Check main item name
        const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
        // Check sub-elements text
        const elements = item.elements || item.directionItemsElements || [];
        const subMatch = elements.some(
          (el: any) =>
            (el.name && el.name.toLowerCase().includes(searchTerm)) ||
            (el.value && el.value.toLowerCase().includes(searchTerm))
        );
        return nameMatch || subMatch;
      });
    }

    // Cache the results
    this.filteredItems[type] = items;

    return items;
  }

  /**
   * Map filter type to API type
   */
  private mapTypeToApiType(filterType: string): string {
    switch (filterType) {
      case 'vision':
        return 'Vision';
      case 'message':
        return 'Message';
      case 'value':
        return 'Value';
      default:
        return 'all';
    }
  }

  /**
   * Check if any items remain after filtering
   */
  hasFilteredItems(): boolean {
    return (
      this.getFilteredDirectionItems('Vision').length > 0 ||
      this.getFilteredDirectionItems('Message').length > 0 ||
      this.getFilteredDirectionItems('Value').length > 0
    );
  }

  /**
   * Get CSS class for status badge
   */
  getStatusClass(status: string): string {
    if (!status) return 'pending';

    if (status.toLowerCase().includes('approved')) {
      return 'approved';
    } else if (status.toLowerCase().includes('rejected')) {
      return 'rejected';
    } else if (status.toLowerCase().includes('returned')) {
      return 'returned';
    } else {
      return 'pending';
    }
  }

  /**
   * Get display text for status
   */
  getStatusText(status: string): string {
    if (!status) return 'معلق';

    if (status.toLowerCase().includes('approved')) {
      return 'موافق عليه';
    } else if (status.toLowerCase().includes('rejected')) {
      return 'مرفوض';
    } else if (status.toLowerCase().includes('returned')) {
      return 'معاد للتعديل';
    } else {
      return 'معلق';
    }
  }

  /**
   * Force UI refresh by triggering change detection
   * Used for debugging purposes
   */
  refreshUI(): void {
    console.log(
      '[StrategicDirectionTableComponent] Manual UI refresh triggered'
    );
    this.updatePlanDirection();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  /**
   * Add a debug method to log item structure
   * This will help identify issues with the structure of data
   */
  logItemStructure(): void {
    console.log('===== DEBUG ITEM STRUCTURE =====');

    // Log direction items by type
    console.log('Vision items:', this.getFilteredDirectionItems('Vision'));
    console.log('Message items:', this.getFilteredDirectionItems('Message'));
    console.log('Value items:', this.getFilteredDirectionItems('Value'));

    // Log first vision item elements if available
    const visionItems = this.getFilteredDirectionItems('Vision');
    if (visionItems.length > 0) {
      const firstItem = visionItems[0];
      console.log('First Vision item:', firstItem);
      console.log('Vision elements property:', firstItem.elements);
      console.log(
        'Vision directionItemsElements property:',
        firstItem.directionItemsElements
      );
    }

    // Check admin status and permissions
    console.log('Is Admin?', this.isAdmin);
    console.log('User Role:', this.authService.getUserRole());
    console.log('===== END DEBUG =====');
  }

  /**
   * Force action buttons to be visible for testing purposes
   * This helps determine if the issue is with visibility logic or with styling
   */
  forceShowActionButtons(): void {
    // Find all admin-actions components and force their display
    const actionButtons = document.querySelectorAll('app-admin-actions');
    actionButtons.forEach((button) => {
      (button as HTMLElement).style.display = 'block';
      (button as HTMLElement).style.visibility = 'visible';
      (button as HTMLElement).style.border = '2px solid red';
    });

    console.log('Forced visibility of', actionButtons.length, 'action buttons');
    this.cdr.detectChanges();
  }

  /**
   * Filter subelements based on search text
   * This method now handles both elements and directionItemsElements structures
   */
  filterSubElements(elements: any[]): any[] {
    if (!elements || !Array.isArray(elements)) return [];

    // If we have a search term, filter the elements
    if (this.filters.searchText && this.filters.searchText.trim() !== '') {
      const searchTerm = this.filters.searchText.toLowerCase();
      return elements.filter(
        (element) =>
          (element.name && element.name.toLowerCase().includes(searchTerm)) ||
          (element.value && element.value.toLowerCase().includes(searchTerm))
      );
    }

    // Otherwise return all elements
    return elements;
  }

  /**
   * Submit the whole direction for approval
   * Delegates to the parent component which handles the actual submission
   */
  submitDirection() {
    // Use the router to navigate to the same route with a query param
    // This will be handled by the parent component
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'approve' },
    });
  }

  showSuccessPopup() {
    this.isSuccessPopupVisible = true;
  }
  generatePDF() {
  const id = Number(this.planId);
console.log(id);
  if (!id) {
    console.error('planId مش موجود في الـ URL');
    return;
  }

  this.pdfService.getPdf(id).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  });
}


Approve() {
  const id = Number(this.planId);
console.log(id);
  if (!id) {
    console.error('planId مش موجود في الـ URL');
    return;
  }

  this.app.ApproveDirection(id).subscribe(blob => {
    window.location.reload();
    
  });
}
 
}


