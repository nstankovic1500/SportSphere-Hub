import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { AdminUser, UpdateAdminUserRequest } from '../../../core/models/admin.model';
import type { Sport } from '../../../core/models/sport.model';
import { AdminService } from '../../../core/services/admin.service';
import { PublicService } from '../../../core/services/public.service';

const phonePattern = /^[0-9+\-\s()]{6,20}$/;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent {
  private readonly adminService = inject(AdminService);
  private readonly publicService = inject(PublicService);
  private readonly formBuilder = inject(FormBuilder);

  users: AdminUser[] = [];
  sports: Sport[] = [];
  editingUserId = '';
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';

  readonly editForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(phonePattern)]],
    email: ['', [Validators.required, Validators.email]],
    role: this.formBuilder.nonNullable.control<'athlete' | 'employee' | 'admin'>('athlete'),
    status: this.formBuilder.nonNullable.control<'pending' | 'approved' | 'rejected' | 'blocked'>('approved'),
    favoriteSports: this.formBuilder.nonNullable.control<string[]>([], {
      validators: [this.maxSelectedSportsValidator],
    }),
    companyName: [''],
    headOfficeAddress: [''],
    registrationNumber: [''],
    pib: [''],
  });

  constructor() {
    this.loadData();

    this.editForm.controls.role.valueChanges.subscribe((role) => {
      this.updateEmployeeValidators(role);
    });
  }

  getRoleLabel(role: AdminUser['role']) {
    return role === 'athlete' ? 'sportista' : role === 'employee' ? 'zaposleni' : 'administrator';
  }

  getStatusLabel(status: AdminUser['status']) {
    switch (status) {
      case 'pending':
        return 'na čekanju';
      case 'approved':
        return 'odobren';
      case 'rejected':
        return 'odbijen';
      case 'blocked':
        return 'blokiran';
      default:
        return status;
    }
  }

  isSportSelected(sportId: string) {
    return this.editForm.controls.favoriteSports.value.includes(sportId);
  }

  canSelectMoreSports(sportId: string) {
    return (
      this.isSportSelected(sportId) ||
      this.editForm.controls.favoriteSports.value.length < 5
    );
  }

  onSportChange(sportId: string, checked: boolean) {
    const currentSports = this.editForm.controls.favoriteSports.value;

    if (checked && currentSports.length >= 5 && !currentSports.includes(sportId)) {
      this.editForm.controls.favoriteSports.markAsTouched();
      this.editForm.controls.favoriteSports.updateValueAndValidity();
      return;
    }

    this.editForm.controls.favoriteSports.setValue(
      checked
        ? [...currentSports, sportId]
        : currentSports.filter((currentSportId) => currentSportId !== sportId),
    );
    this.editForm.controls.favoriteSports.markAsTouched();
    this.editForm.controls.favoriteSports.updateValueAndValidity();
  }

  startEdit(user: AdminUser) {
    this.editingUserId = user.id;
    const favoriteSportIds = this.sports
      .filter((sport) => user.favoriteSports.includes(sport.name))
      .map((sport) => sport.id);

    this.editForm.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      favoriteSports: favoriteSportIds,
      companyName: user.employeeData?.companyName ?? '',
      headOfficeAddress: user.employeeData?.headOfficeAddress ?? '',
      registrationNumber: user.employeeData?.registrationNumber ?? '',
      pib: user.employeeData?.pib ?? '',
    });
    this.updateEmployeeValidators(user.role);
  }

  cancelEdit() {
    this.editingUserId = '';
    this.editForm.reset({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      role: 'athlete',
      status: 'approved',
      favoriteSports: [],
      companyName: '',
      headOfficeAddress: '',
      registrationNumber: '',
      pib: '',
    });
    this.updateEmployeeValidators('athlete');
  }

  saveUser(user: AdminUser) {
    if (this.editForm.invalid || this.isSaving) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();
    const payload: UpdateAdminUserRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      phone: formValue.phone.trim(),
      email: formValue.email.trim(),
      role: formValue.role,
      status: formValue.status,
      favoriteSports: formValue.favoriteSports,
    };

    if (formValue.role === 'employee') {
      payload.employeeData = {
        companyName: formValue.companyName.trim(),
        headOfficeAddress: formValue.headOfficeAddress.trim(),
        registrationNumber: formValue.registrationNumber.trim(),
        pib: formValue.pib.trim(),
      };
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.updateUser(user.id, payload).subscribe({
      next: (response) => {
        this.users = this.users.map((currentUser) =>
          currentUser.id === user.id ? response.data.user : currentUser,
        );
        this.isSaving = false;
        this.successMessage = 'Korisnik je uspešno ažuriran.';
        this.cancelEdit();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće ažurirati korisnika.';
      },
    });
  }

  deleteUser(user: AdminUser) {
    if (this.isDeleting || !window.confirm(`Obrisati nalog korisnika ${user.username}?`)) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((currentUser) => currentUser.id !== user.id);
        this.isDeleting = false;
        this.successMessage = 'Korisnik je uspešno obrisan.';
      },
      error: (error) => {
        this.isDeleting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće obrisati korisnika.';
      },
    });
  }

  private loadData() {
    this.publicService.getSports().subscribe({
      next: (response) => {
        this.sports = response.data.sports;
      },
    });

    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data.users;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati korisnike.';
        this.isLoading = false;
      },
    });
  }

  private updateEmployeeValidators(role: 'athlete' | 'employee' | 'admin') {
    const {
      companyName,
      headOfficeAddress,
      registrationNumber,
      pib,
    } = this.editForm.controls;

    if (role === 'employee') {
      companyName.setValidators([Validators.required]);
      headOfficeAddress.setValidators([Validators.required]);
      registrationNumber.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/),
      ]);
      pib.setValidators([
        Validators.required,
        Validators.pattern(/^[1-9]\d{8}$/),
      ]);
    } else {
      companyName.clearValidators();
      headOfficeAddress.clearValidators();
      registrationNumber.clearValidators();
      pib.clearValidators();
      companyName.setValue('', { emitEvent: false });
      headOfficeAddress.setValue('', { emitEvent: false });
      registrationNumber.setValue('', { emitEvent: false });
      pib.setValue('', { emitEvent: false });
    }

    companyName.updateValueAndValidity({ emitEvent: false });
    headOfficeAddress.updateValueAndValidity({ emitEvent: false });
    registrationNumber.updateValueAndValidity({ emitEvent: false });
    pib.updateValueAndValidity({ emitEvent: false });
  }

  private maxSelectedSportsValidator(control: AbstractControl<string[]>): ValidationErrors | null {
    return Array.isArray(control.value) && control.value.length > 5
      ? { maxSelectedSports: true }
      : null;
  }
}
