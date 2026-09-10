import { PipeTransform } from '@angular/core';

import { Pipe } from '@angular/core';
import {
  ModuleType,
  PermissionsService,
  PermissionType,
} from '../../Core/Service/permissions.service';

@Pipe({
  name: 'permissionCheck',
  standalone: true,
  pure: true,
})
export class PermissionCheckPipe implements PipeTransform {
  constructor(private permissionsService: PermissionsService) {}

  transform(page: ModuleType, actions: PermissionType[]): boolean {
    return this.permissionsService.isAllowedToAccess(page, actions);
  }
}
