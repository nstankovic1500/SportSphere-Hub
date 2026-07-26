import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import type { EmployeeProduct } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-products.component.html',
  styleUrl: './employee-products.component.css',
})
export class EmployeeProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly filterForm = this.formBuilder.nonNullable.group({
    active: this.formBuilder.control<'all' | 'true' | 'false'>('all'),
  });

  products: EmployeeProduct[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  deletingIds = new Set<string>();

  constructor() {
    this.filterForm.controls.active.valueChanges.subscribe(() => {
      this.loadProducts();
    });

    this.loadProducts();
  }

  deleteProduct(product: EmployeeProduct) {
    if (!window.confirm(`Delete product ${product.name}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingIds.add(product.id);

    this.employeeService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((currentProduct) => currentProduct.id !== product.id);
        this.deletingIds.delete(product.id);
        this.successMessage = 'Product deleted successfully.';
      },
      error: (error) => {
        this.deletingIds.delete(product.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće obrisati proizvod.';
      },
    });
  }

  isDeleting(productId: string) {
    return this.deletingIds.has(productId);
  }

  getActiveLabel(product: EmployeeProduct) {
    return product.active ? 'Yes' : 'No';
  }

  private loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    const activeFilter = this.filterForm.getRawValue().active;
    const active =
      activeFilter === 'all' ? undefined : activeFilter === 'true';

    this.employeeService.getProducts(this.facilityId, active).subscribe({
      next: (response) => {
        this.products = response.data.products;
        this.isLoading = false;
      },
      error: (error) => {
        this.products = [];
        this.errorMessage = error.error?.message ?? 'Unable to load products.';
        this.isLoading = false;
      },
    });
  }
}
