import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import type {
  CreateEmployeePromotionRequest,
  EmployeeFacility,
  EmployeePromotion,
  UpdateEmployeePromotionRequest,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './promotion-form.component.html',
  styleUrl: './promotion-form.component.css',
})
export class PromotionFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly promotionId = this.route.snapshot.paramMap.get('promotionId');
  readonly isEditMode = !!this.promotionId;

  readonly promotionForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    sportId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    discountType: this.formBuilder.nonNullable.control<'percentage' | 'fixed'>('percentage'),
    discountValue: [1, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  facility: EmployeeFacility | null = null;
  promotion: EmployeePromotion | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.promotionForm.controls.discountType.valueChanges.subscribe((discountType) => {
      const control = this.promotionForm.controls.discountValue;

      if (discountType === 'percentage') {
        control.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      } else {
        control.setValidators([Validators.required, Validators.min(0.000001)]);
      }

      control.updateValueAndValidity();
    });

    this.loadPageData();
  }

  get supportedSports() {
    return this.facility?.sports ?? [];
  }

  submit() {
    if (this.promotionForm.invalid || this.isSubmitting || !this.hasValidDateRange()) {
      this.promotionForm.markAllAsTouched();
      if (!this.hasValidDateRange()) {
        this.errorMessage = 'End date must be after start date.';
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isEditMode && this.promotionId
      ? this.employeeService.updatePromotion(this.promotionId, this.makeUpdatePayload())
      : this.employeeService.createPromotion(this.facilityId, this.makeCreatePayload());

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.isEditMode
          ? 'Promotion updated successfully.'
          : 'Promotion created successfully.';
        window.setTimeout(() => {
          void this.router.navigate(['/employee/facilities', this.facilityId, 'promotions']);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće sačuvati promociju.';
      },
    });
  }

  private loadPageData() {
    const requests: Record<string, any> = {
      facilityResponse: this.employeeService.getFacility(this.facilityId),
    };

    if (this.isEditMode) {
      requests['promotionsResponse'] = this.employeeService.getPromotions(this.facilityId);
    }

    forkJoin(requests).subscribe({
      next: (response: any) => {
        this.facility = response.facilityResponse.data.facility;

        if (this.isEditMode) {
          this.promotion = response.promotionsResponse.data.promotions.find(
            (promotion: EmployeePromotion) => promotion.id === this.promotionId,
          ) ?? null;

          if (this.promotion) {
            this.promotionForm.reset({
              name: this.promotion.name,
              sportId: this.promotion.sport.id,
              startDate: this.promotion.startDate.slice(0, 10),
              endDate: this.promotion.endDate.slice(0, 10),
              discountType: this.promotion.discountType,
              discountValue: this.promotion.discountValue,
              active: this.promotion.active,
            });
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati formu promocije.';
        this.isLoading = false;
      },
    });
  }

  private hasValidDateRange() {
    const { startDate, endDate } = this.promotionForm.getRawValue();

    if (!startDate || !endDate) {
      return true;
    }

    return new Date(endDate).getTime() > new Date(startDate).getTime();
  }

  private makeCreatePayload(): CreateEmployeePromotionRequest {
    const formValue = this.promotionForm.getRawValue();

    return {
      name: formValue.name.trim(),
      sportId: formValue.sportId,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      discountType: formValue.discountType,
      discountValue: Number(formValue.discountValue),
    };
  }

  private makeUpdatePayload(): UpdateEmployeePromotionRequest {
    const formValue = this.promotionForm.getRawValue();

    return {
      name: formValue.name.trim(),
      sportId: formValue.sportId,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      discountType: formValue.discountType,
      discountValue: Number(formValue.discountValue),
      active: formValue.active,
    };
  }
}
