import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type {
  EmployeeFacility,
  EmployeeOrder,
  UpdateEmployeeOrderStatusRequest,
} from '../../../core/models/employee.model';
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

  private normalizeStatus(status: string): EmployeeOrder['status'] {
    switch (status) {
      case 'ordered':
        return 'pending';
      case 'accepted':
        return 'processing';
      case 'collected':
        return 'completed';
      case 'processing':
      case 'completed':
      case 'cancelled':
      case 'pending':
        return status;
      default:
        return 'pending';
    }
  }

  private normalizeOrder(order: EmployeeOrder): EmployeeOrder {
    return {
      ...order,
      status: this.normalizeStatus(order.status),
    };
  }

  getStatusLabel(status: EmployeeOrder['status']) {
    switch (this.normalizeStatus(status)) {
      case 'pending':
        return 'Na čekanju';
      case 'processing':
        return 'U obradi';
      case 'completed':
        return 'Završena';
      case 'cancelled':
        return 'Otkazana';
      default:
        return status;
    }
  }

  getActionLabel(action: UpdateEmployeeOrderStatusRequest['status']) {
    switch (action) {
      case 'processing':
        return 'Obradi';
      case 'completed':
        return 'Završi';
      case 'cancelled':
        return 'Otkaži';
      case 'pending':
        return 'Na čekanju';
      default:
        return action;
    }
  }

  getAvailableActions(order: EmployeeOrder) {
    const actions: Array<'pending' | 'processing' | 'completed' | 'cancelled'> = [];
    const normalizedStatus = this.normalizeStatus(order.status);

    if (normalizedStatus === 'pending') {
      actions.push('processing');
    }

    if (normalizedStatus === 'processing') {
      actions.push('completed');
    }

    if (normalizedStatus !== 'completed' && normalizedStatus !== 'cancelled') {
      actions.push('cancelled');
    }

    return actions;
  }

  updateStatus(order: EmployeeOrder, status: UpdateEmployeeOrderStatusRequest['status']) {
    if (this.updatingIds.has(order.id)) {
      return;
    }

    if (status === 'cancelled' && !window.confirm(`Otkaži porudžbinu ${this.getShortReference(order.id)}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingIds.add(order.id);

    this.employeeService.updateOrderStatus(order.id, { status }).subscribe({
      next: (response) => {
        this.orders = this.orders.map((currentOrder) =>
          currentOrder.id === order.id ? this.normalizeOrder(response.data.order) : currentOrder,
        );
        this.updatingIds.delete(order.id);
        this.successMessage = `Porudžbina ${this.getShortReference(order.id)} je uspešno ažurirana.`;
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
        this.orders = response.data.orders.map((order) => this.normalizeOrder(order));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati porudžbine.';
        this.isLoading = false;
      },
    });
  }
}
