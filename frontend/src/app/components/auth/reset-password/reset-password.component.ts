import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].{7,11}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', Validators.required],
  });

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  get password() {
    return this.resetPasswordForm.controls.password;
  }

  get confirmPassword() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  submit() {
    if (this.resetPasswordForm.invalid || this.isSubmitting) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (this.password.value !== this.confirmPassword.value) {
      this.errorMessage = 'Lozinke se ne poklapaju.';
      return;
    }

    const token = String(this.route.snapshot.paramMap.get('token') ?? '').trim();

    if (!token) {
      this.errorMessage = 'Link za resetovanje lozinke nije ispravan.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(token, this.password.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Lozinka je uspešno promenjena.';
        window.setTimeout(() => {
          void this.router.navigate(['/login']);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće postaviti novu lozinku.';
      },
    });
  }
}
