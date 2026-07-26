import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    identifier: ['', Validators.required],
  });

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  resetLink = '';
  expiresAt = '';

  get identifier() {
    return this.forgotPasswordForm.controls.identifier;
  }

  submit() {
    if (this.forgotPasswordForm.invalid || this.isSubmitting) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.resetLink = '';
    this.expiresAt = '';

    this.authService.forgotPassword(this.identifier.value.trim()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Privremeni link za postavljanje nove lozinke je uspešno generisan.';
        this.resetLink = response.data.resetLink;
        this.expiresAt = response.data.expiresAt;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće generisati link za novu lozinku.';
      },
    });
  }
}
