import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeePromotion } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './employee-promotions.component.html',
  styleUrl: './employee-promotions.component.css',
})
export class EmployeePromotionsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  promotions: EmployeePromotion[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  deletingIds = new Set<string>();

  constructor() {
    this.loadPromotions();
  }

  getDiscountLabel(promotion: EmployeePromotion) {
    return promotion.discountType === 'percentage'
      ? `${promotion.discountValue}%`
      : `${promotion.discountValue} fixed`;
  }

  getPeriodLabel(promotion: EmployeePromotion) {
    return `${promotion.startDate} - ${promotion.endDate}`;
  }

  deletePromotion(promotion: EmployeePromotion) {
    if (!window.confirm(`Delete promotion ${promotion.name}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingIds.add(promotion.id);

    this.employeeService.deletePromotion(promotion.id).subscribe({
      next: () => {
        this.promotions = this.promotions.filter(
          (currentPromotion) => currentPromotion.id !== promotion.id,
        );
        this.deletingIds.delete(promotion.id);
        this.successMessage = 'Promotion deleted successfully.';
      },
      error: (error) => {
        this.deletingIds.delete(promotion.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće obrisati promociju.';
      },
    });
  }

  isDeleting(promotionId: string) {
    return this.deletingIds.has(promotionId);
  }

  private loadPromotions() {
    this.employeeService.getPromotions(this.facilityId).subscribe({
      next: (response) => {
        this.promotions = response.data.promotions;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati promocije.';
        this.isLoading = false;
      },
    });
  }
}
