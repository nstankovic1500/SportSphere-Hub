import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeeFacility, EmployeeOrder, UpdateEmployeeOrderStatusRequest } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './employee-orders.component.html',
  styleUrl: './employee-orders.component.css',
})
export class EmployeeOrdersComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-RS', {
    style: 'currency',
    currency: 'RSD',
  });

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  facility: EmployeeFacility | null = null;
  orders: EmployeeOrder[] = [];
  updatingIds = new Set<string>();
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadPageData();
  }

  formatCurrency(value: number) {
    return this.currencyFormatter.format(value);
  }

  getShortReference(orderId: string) {
    return orderId.slice(-8).toUpperCase();
  }

  getAvailableActions(order: EmployeeOrder) {
    const actions: Array<'pending' | 'processing' | 'completed' | 'cancelled'> = [];

    if (order.status === 'pending') {
      actions.push('processing');
    }

    if (order.status === 'processing') {
      actions.push('completed');
    }

    if (order.status !== 'completed' && order.status !== 'cancelled') {
      actions.push('cancelled');
    }

    return actions;
  }

  updateStatus(order: EmployeeOrder, status: UpdateEmployeeOrderStatusRequest['status']) {
    if (this.updatingIds.has(order.id)) {
      return;
    }

    if (status === 'cancelled' && !window.confirm(`Cancel order ${this.getShortReference(order.id)}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingIds.add(order.id);

    this.employeeService.updateOrderStatus(order.id, { status }).subscribe({
      next: (response) => {
        this.orders = this.orders.map((currentOrder) =>
          currentOrder.id === order.id ? response.data.order : currentOrder,
        );
        this.updatingIds.delete(order.id);
        this.successMessage = `Order ${this.getShortReference(order.id)} updated successfully.`;
      },
      error: (error) => {
        this.updatingIds.delete(order.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće ažurirati status porudžbine.';
      },
    });
  }

  isUpdating(orderId: string) {
    return this.updatingIds.has(orderId);
  }

  private loadPageData() {
    this.employeeService.getFacility(this.facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
      },
      error: () => {
        this.facility = null;
      },
    });

    this.employeeService.getOrders(this.facilityId).subscribe({
      next: (response) => {
        this.orders = response.data.orders;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati porudžbine.';
        this.isLoading = false;
      },
    });
  }
}
