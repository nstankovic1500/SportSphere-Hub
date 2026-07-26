import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeeResource } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-resources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-resources.component.html',
  styleUrl: './employee-resources.component.css',
})
export class EmployeeResourcesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  resources: EmployeeResource[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  deletingIds = new Set<string>();

  constructor() { this.loadResources(); }

  deleteResource(resource: EmployeeResource) {
    if (!window.confirm(`Delete resource ${resource.name}?`)) { return; }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingIds.add(resource.id);

    this.employeeService.deleteResource(resource.id).subscribe({
      next: () => {
        this.resources = this.resources.filter((currentResource) => !(currentResource.id === resource.id));
        this.deletingIds.delete(resource.id);
        this.successMessage = 'Resource deleted successfully.';
      },
      error: (error) => {
        this.deletingIds.delete(resource.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće obrisati resurs.';
      },
    });
  }

  isDeleting(resourceId: string) { return this.deletingIds.has(resourceId); }

  private loadResources() {
    this.employeeService.getResources(this.facilityId).subscribe({
      next: (response) => {
        this.resources = response.data.resources;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati resurse.';
        this.isLoading = false;
      },
    });
  }
}
