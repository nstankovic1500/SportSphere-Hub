import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AthleteOrder } from '../../../core/models/athlete.model';
import { AthleteService } from '../../../core/services/athlete.service';

@Component({
  selector: 'app-athlete-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './athlete-orders.component.html',
  styleUrl: './athlete-orders.component.css',
})
export class AthleteOrdersComponent {
  private readonly athleteService = inject(AthleteService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-RS', {
    style: 'currency',
    currency: 'RSD',
  });

  orders: AthleteOrder[] = [];
  updatingIds = new Set<string>();
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadOrders();
  }

  get activeOrders() {
    return this.orders.filter((order) => order.status === 'pending' || order.status === 'processing');
  }

  get orderHistory() {
    return this.orders.filter((order) => order.status === 'completed' || order.status === 'cancelled');
  }

  formatCurrency(value: number) {
    return this.currencyFormatter.format(value);
  }

  getShortReference(orderId: string) {
    return orderId.slice(-8).toUpperCase();
  }

  canCancel(order: AthleteOrder) {
    return order.status === 'pending' || order.status === 'processing';
  }

  cancelOrder(order: AthleteOrder) {
    if (!this.canCancel(order) || this.updatingIds.has(order.id)) {
      return;
    }

    if (!window.confirm(`Cancel order ${this.getShortReference(order.id)}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingIds.add(order.id);

    this.athleteService.updateOrderStatus(order.id, 'cancelled').subscribe({
      next: (response) => {
        this.orders = this.orders.map((currentOrder) =>
          currentOrder.id === order.id ? response.data.order : currentOrder,
        );
        this.updatingIds.delete(order.id);
        this.successMessage = `Order ${this.getShortReference(order.id)} cancelled successfully.`;
      },
      error: (error) => {
        this.updatingIds.delete(order.id);
        this.errorMessage = error.error?.message ?? 'Unable to cancel order.';
      },
    });
  }

  isUpdating(orderId: string) {
    return this.updatingIds.has(orderId);
  }

  private loadOrders() {
    this.athleteService.getOrders().subscribe({
      next: (response) => {
        this.orders = response.data.orders;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load orders.';
        this.isLoading = false;
      },
    });
  }
}
