import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import type {
  CreateEmployeeResourceRequest,
  EmployeeFacility,
  EmployeeResource,
  UpdateEmployeeResourceRequest,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-resource-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-resource-form.component.html',
  styleUrl: './employee-resource-form.component.css',
})
export class EmployeeResourceFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly resourceId = this.route.snapshot.paramMap.get('resourceId');
  readonly isEditMode = !!this.resourceId;

  readonly resourceForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    type: this.formBuilder.nonNullable.control<'outdoor' | 'indoor' | 'team_hall'>('outdoor'),
    sportId: ['', Validators.required],
    capacity: [4, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    equipmentDescription: ['', [Validators.required, Validators.maxLength(300)]],
    active: [true],
  });

  facility: EmployeeFacility | null = null;
  resource: EmployeeResource | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() { this.loadPageData(); }

  get supportedSports() { return this.facility?.sports ?? []; }

  submit() {
    if (this.resourceForm.invalid || this.isSubmitting) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isEditMode && this.resourceId
      ? this.employeeService.updateResource(this.resourceId, this.makeUpdatePayload())
      : this.employeeService.createResource(this.facilityId, this.makeCreatePayload());

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.isEditMode ? 'Resource updated successfully.' : 'Resource created successfully.';
        window.setTimeout(() => {
          void this.router.navigate(['/employee/facilities', this.facilityId, 'resources']);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Unable to save resource.';
      },
    });
  }

  private loadPageData() {
    const requests: any = {
      facilityResponse: this.employeeService.getFacility(this.facilityId),
    };

    if (this.isEditMode) {
      requests.resourcesResponse = this.employeeService.getResources(this.facilityId);
    }

    forkJoin(requests).subscribe({
      next: (response: any) => {
        this.facility = response.facilityResponse.data.facility;

        if (this.isEditMode) {
          this.resource = response.resourcesResponse.data.resources.find(
            (resource: EmployeeResource) => resource.id === this.resourceId,
          ) ?? null;

          if (this.resource) {
            this.resourceForm.reset({
              name: this.resource.name,
              type: this.resource.type,
              sportId: this.resource.sport.id,
              capacity: this.resource.capacity,
              equipmentDescription: this.resource.equipmentDescription,
              active: this.resource.active,
            });
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load resource form.';
        this.isLoading = false;
      },
    });
  }

  private makeCreatePayload(): CreateEmployeeResourceRequest {
    const formValue = this.resourceForm.getRawValue();
    return {
      name: formValue.name.trim(),
      type: formValue.type,
      sportId: formValue.sportId,
      capacity: Number(formValue.capacity),
      equipmentDescription: formValue.equipmentDescription.trim(),
    };
  }

  private makeUpdatePayload(): UpdateEmployeeResourceRequest {
    const formValue = this.resourceForm.getRawValue();
    return {
      name: formValue.name.trim(),
      type: formValue.type,
      sportId: formValue.sportId,
      capacity: Number(formValue.capacity),
      equipmentDescription: formValue.equipmentDescription.trim(),
      active: formValue.active,
    };
  }
}
