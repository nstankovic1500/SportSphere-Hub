import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { PublicProduct, PublicProductFacilityGroup } from '../../../core/models/public.model';
import { AthleteService } from '../../../core/services/athlete.service';
import { PublicService } from '../../../core/services/public.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

type ShopProduct = PublicProduct & {
  facilityName: string;
  facilityId: string;
};

@Component({
  selector: 'app-athlete-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './athlete-shop.component.html',
  styleUrl: './athlete-shop.component.css',
})
export class AthleteShopComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicService = inject(PublicService);
  private readonly athleteService = inject(AthleteService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    facilityId: [''],
    category: [''],
    name: [''],
  });

  facilityGroups: PublicProductFacilityGroup[] = [];
  allProducts: ShopProduct[] = [];
  filteredProducts: ShopProduct[] = [];
  quantityValues: Record<string, number> = {};
  addingIds = new Set<string>();
  addedIds = new Set<string>();
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.loadProducts();
  }

  get facilities() {
    return this.facilityGroups.map((group) => group.facility);
  }

  get categories() {
    return [...new Set(this.allProducts.map((product) => product.category))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  getQuantity(productId: string) {
    return this.quantityValues[productId] ?? 1;
  }

  setQuantity(productId: string, value: string, stock: number) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      this.quantityValues[productId] = 1;
      return;
    }

    this.quantityValues[productId] = Math.min(parsedValue, stock);
  }

  addToCart(product: ShopProduct) {
    const quantity = this.getQuantity(product.id);

    if (this.addingIds.has(product.id) || product.stock === 0) {
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      this.errorMessage = 'Quantity must be a positive integer.';
      return;
    }

    if (quantity > product.stock) {
      this.errorMessage = 'Quantity cannot exceed current stock.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.addingIds.add(product.id);

    this.athleteService.addCartItem({
      productId: product.id,
      quantity,
    }).subscribe({
      next: () => {
        this.addingIds.delete(product.id);
        this.addedIds.add(product.id);
        this.successMessage = `${product.name} added to cart.`;
        this.quantityValues[product.id] = 1;
        window.setTimeout(() => {
          this.addedIds.delete(product.id);
        }, 2000);
      },
      error: (error) => {
        this.addingIds.delete(product.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće dodati stavku u korpu.';
      },
    });
  }

  isAdding(productId: string) {
    return this.addingIds.has(productId);
  }

  isAdded(productId: string) {
    return this.addedIds.has(productId);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://placehold.co/320x180?text=Product';
  }

  getImageUrl(imagePath: string | null) {
    return buildUploadImageUrl(imagePath);
  }

  private loadProducts() {
    this.publicService.getProducts().subscribe({
      next: (response) => {
        this.facilityGroups = response.data.facilities;
        this.allProducts = response.data.facilities.flatMap((group) =>
          group.products.map((product) => ({
            ...product,
            facilityName: group.facility.name,
            facilityId: group.facility.id,
          })),
        );

        this.allProducts.forEach((product) => {
          this.quantityValues[product.id] = 1;
        });

        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load products.';
        this.isLoading = false;
      },
    });
  }

  private applyFilters() {
    const { facilityId, category, name } = this.filterForm.getRawValue();
    const normalizedName = name.trim().toLowerCase();

    this.filteredProducts = this.allProducts.filter((product) => {
      const matchesFacility = !facilityId || product.facilityId === facilityId;
      const matchesCategory = !category || product.category === category;
      const matchesName =
        !normalizedName ||
        product.name.toLowerCase().includes(normalizedName) ||
        product.description.toLowerCase().includes(normalizedName);

      return matchesFacility && matchesCategory && matchesName;
    });
  }
}
