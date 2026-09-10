import { Injectable, signal } from '@angular/core';
import { PermissionType } from './permissions.service';
import { ModuleType } from './permissions.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private strategicPlanData = signal<any>(null);
  private analysisData = signal<any>(null);
  private userPreferences = signal<any>(null);
  private planId = signal<any>(null);
  private permissionsSubject = new BehaviorSubject<Record<
    ModuleType,
    PermissionType[]
  > | null>(null);

  constructor() {
    // Load permissions from localStorage when this service initializes
    this.loadPermissionsFromLocalStorage();
  }

  setPermissions(permissions: Record<ModuleType, PermissionType[]>) {
    this.permissionsSubject.next(permissions);
    const encodedPermissions = btoa(JSON.stringify(permissions));
    localStorage.setItem('permissions', encodedPermissions);
  }

  getPermissions() {
    return this.permissionsSubject.asObservable();
  }

  loadPermissionsFromLocalStorage() {
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      const decodedPermissions = JSON.parse(atob(storedPermissions));
      this.permissionsSubject.next(decodedPermissions);
      return true;
    }
    return false;
  }

  // Strategic Plan Methods
  setStrategicPlanData(data: any): void {
    this.strategicPlanData.set(data);
  }

  getStrategicPlanData() {
    return this.strategicPlanData;
  }

  // Analysis Data Methods
  setAnalysisData(data: any): void {
    this.analysisData.set(data);
  }

  getAnalysisData() {
    return this.analysisData();
  }

  // User Preferences Methods
  setUserPreferences(preferences: any): void {
    this.userPreferences.set(preferences);
  }

  getUserPreferences() {
    return this.userPreferences;
  }

  setPlanId(id: any): void {
    this.planId.set(id);
  }

  getPlanId() {
    return this.planId();
  }

  // Clear all shared data
  clearAllData(): void {
    this.strategicPlanData.set(null);
    this.analysisData.set(null);
    this.userPreferences.set(null);
    this.planId.set(null);
  }
}
