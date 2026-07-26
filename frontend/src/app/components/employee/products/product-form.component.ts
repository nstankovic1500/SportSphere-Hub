import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import type {
  EmployeeFacility,
  EmployeeProduct,
  EmployeeProductRequest,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly productId = this.route.snapshot.paramMap.get('productId');
  readonly isEditMode = !!this.productId;

  readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    image: [''],
    active: [true],
  });

  facility: EmployeeFacility | null = null;
  product: EmployeeProduct | null = null;
  isLoading = true;
  isSubmitting = false;
  isUploadingImage = false;
  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  selectedImageFile: File | null = null;
  imagePreview = '';

  get productImageUrl() {
    return this.imagePreview || buildUploadImageUrl(this.product?.image);
  }

  constructor() {
    this.loadPageData();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageErrorMessage = '';

    if (!file) {
      this.selectedImageFile = null;
      this.imagePreview = '';
      return;
    }

    const validationError = this.validateImageFile(file);

    if (validationError) {
      input.value = '';
      this.selectedImageFile = null;
      this.imagePreview = '';
      this.imageErrorMessage = validationError;
      return;
    }

    this.selectedImageFile = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  submit() {
    if (this.productForm.invalid || this.isSubmitting) {
      this.productForm.markAllAsTouched();
      if (this.productForm.invalid) {
        this.errorMessage = 'Please correct the product form fields and try again.';
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isEditMode && this.productId
      ? this.employeeService.updateProduct(this.productId, this.makePayload())
      : this.employeeService.createProduct(this.facilityId, this.makePayload(this.isEditMode));

    request$.subscribe({
      next: (response) => {
        const savedProductId = response.data.product.id;
        this.product = response.data.product;

        if (!this.selectedImageFile) {
          this.finishSuccess();
          return;
        }

        this.isUploadingImage = true;

        this.employeeService.uploadProductImage(savedProductId, this.selectedImageFile).subscribe({
          next: (uploadResponse) => {
            if (this.product) {
              this.product = {
                ...this.product,
                image: uploadResponse.data.imagePath,
              };
            }

            this.isUploadingImage = false;
            this.finishSuccess();
          },
          error: (error) => {
            this.isSubmitting = false;
            this.isUploadingImage = false;
            this.errorMessage = error.error?.message ?? 'Product was saved, but the image could not be uploaded.';
          },
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće sačuvati proizvod.';
      },
    });
  }

  private loadPageData() {
    const requests: Record<string, any> = {
      facilityResponse: this.employeeService.getFacility(this.facilityId),
    };

    if (this.isEditMode) {
      requests['productsResponse'] = this.employeeService.getProducts(this.facilityId);
    }

    forkJoin(requests).subscribe({
      next: (response: any) => {
        this.facility = response.facilityResponse.data.facility;

        if (this.isEditMode) {
          this.product = response.productsResponse.data.products.find(
            (product: EmployeeProduct) => product.id === this.productId,
          ) ?? null;

          if (this.product) {
            this.productForm.reset({
              name: this.product.name,
              description: this.product.description,
              category: this.product.category,
              price: this.product.price,
              stock: this.product.stock,
              image: '',
              active: this.product.active,
            });
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati formu proizvoda.';
        this.isLoading = false;
      },
    });
  }

  private makePayload(includeActive = true): EmployeeProductRequest {
    const formValue = this.productForm.getRawValue();
    const payload: EmployeeProductRequest = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      category: formValue.category.trim(),
      price: Number(formValue.price),
      stock: Number(formValue.stock),
      image: formValue.image.trim(),
    };

    if (includeActive) {
      payload.active = formValue.active;
    }

    return payload;
  }

  private finishSuccess() {
    this.isSubmitting = false;
    this.successMessage = this.isEditMode
      ? 'Proizvod je uspešno ažuriran.'
      : 'Proizvod je uspešno kreiran.';

    window.setTimeout(() => {
      void this.router.navigate(['/employee/facilities', this.facilityId, 'products']);
    }, 1200);
  }

  private validateImageFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG and WEBP images are allowed.';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must not exceed 5 MB.';
    }

    return '';
  }
}
