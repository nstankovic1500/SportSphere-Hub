import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import type { AthleteCartItem } from '../../../core/models/athlete.model';
import { AthleteService } from '../../../core/services/athlete.service';

@Component({
  selector: 'app-athlete-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './athlete-cart.component.html',
  styleUrl: './athlete-cart.component.css',
})
export class AthleteCartComponent {
  private readonly athleteService = inject(AthleteService);
  private readonly router = inject(Router);
  private readonly currencyFormatter = new Intl.NumberFormat('en-RS', {
    style: 'currency',
    currency: 'RSD',
  });

  items: AthleteCartItem[] = [];
  totalPrice = 0;
  updatingIds = new Set<string>();
  isCheckingOut = false;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadCart();
  }

  formatCurrency(value: number) {
    return this.currencyFormatter.format(value);
  }

  updateQuantity(item: AthleteCartItem, quantity: number) {
    if (this.updatingIds.has(item.id) || quantity < 1) {
      if (quantity < 1) {
        this.errorMessage = 'Quantity must be at least 1.';
      }
      return;
    }

    this.updatingIds.add(item.id);
    this.errorMessage = '';
    this.successMessage = '';

    this.athleteService.updateCartItem(item.id, { quantity }).subscribe({
      next: (response) => {
        this.items = response.data.items;
        this.totalPrice = response.data.totalPrice;
        this.updatingIds.delete(item.id);
      },
      error: (error) => {
        this.updatingIds.delete(item.id);
        this.errorMessage = error.error?.message ?? 'Unable to update cart item.';
      },
    });
  }

  removeItem(item: AthleteCartItem) {
    if (this.updatingIds.has(item.id)) {
      return;
    }

    this.updatingIds.add(item.id);
    this.errorMessage = '';
    this.successMessage = '';

    this.athleteService.deleteCartItem(item.id).subscribe({
      next: (response) => {
        this.items = response.data.items;
        this.totalPrice = response.data.totalPrice;
        this.updatingIds.delete(item.id);
        this.successMessage = 'Item removed from cart.';
      },
      error: (error) => {
        this.updatingIds.delete(item.id);
        this.errorMessage = error.error?.message ?? 'Unable to remove cart item.';
      },
    });
  }

  onQuantityInput(item: AthleteCartItem, value: string) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      this.errorMessage = 'Quantity must be a positive integer.';
      return;
    }

    this.updateQuantity(item, parsedValue);
  }

  checkout() {
    if (this.items.length === 0 || this.isCheckingOut) {
      return;
    }

    if (!window.confirm('Confirm checkout for the current cart?')) {
      return;
    }

    this.isCheckingOut = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.athleteService.checkoutOrders().subscribe({
      next: () => {
        this.items = [];
        this.totalPrice = 0;
        this.isCheckingOut = false;
        this.successMessage = 'Order created successfully.';
        window.setTimeout(() => {
          void this.router.navigate(['/athlete/orders']);
        }, 1200);
      },
      error: (error) => {
        this.isCheckingOut = false;
        this.errorMessage = error.error?.message ?? 'Unable to complete checkout.';
      },
    });
  }

  isUpdating(itemId: string) {
    return this.updatingIds.has(itemId);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://placehold.co/120x120?text=Product';
  }

  private loadCart() {
    this.athleteService.getCart().subscribe({
      next: (response) => {
        this.items = response.data.items;
        this.totalPrice = response.data.totalPrice;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load cart.';
        this.isLoading = false;
      },
    });
  }
}
