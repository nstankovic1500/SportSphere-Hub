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

  private normalizeStatus(status: string): AthleteOrder['status'] {
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

  private normalizeOrder(order: AthleteOrder): AthleteOrder {
    return {
      ...order,
      status: this.normalizeStatus(order.status),
    };
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

  getStatusLabel(status: AthleteOrder['status']) {
    switch (this.normalizeStatus(status)) {
      case 'pending':
        return 'na čekanju';
      case 'processing':
        return 'u obradi';
      case 'completed':
        return 'završena';
      case 'cancelled':
        return 'otkazana';
      default:
        return status;
    }
  }

  cancelOrder(order: AthleteOrder) {
    if (!this.canCancel(order) || this.updatingIds.has(order.id)) {
      return;
    }

    if (!window.confirm(`Otkaži porudžbinu ${this.getShortReference(order.id)}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingIds.add(order.id);

    this.athleteService.updateOrderStatus(order.id, 'cancelled').subscribe({
      next: (response) => {
        this.orders = this.orders.map((currentOrder) =>
          currentOrder.id === order.id ? this.normalizeOrder(response.data.order) : currentOrder,
        );
        this.updatingIds.delete(order.id);
        this.successMessage = `Porudžbina ${this.getShortReference(order.id)} je uspešno otkazana.`;
      },
      error: (error) => {
        this.updatingIds.delete(order.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće otkazati porudžbinu.';
      },
    });
  }

  isUpdating(orderId: string) {
    return this.updatingIds.has(orderId);
  }

  private loadOrders() {
    this.athleteService.getOrders().subscribe({
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
