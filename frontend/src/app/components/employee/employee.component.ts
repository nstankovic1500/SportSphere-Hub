import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css',
})
export class EmployeeComponent {
  private authService = inject(AuthService);
  user: User | null = this.authService.getCurrentUser();

  logout() {
    this.authService.logout();
  }
}
