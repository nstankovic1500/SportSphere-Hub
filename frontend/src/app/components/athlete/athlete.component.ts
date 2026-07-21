import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-athlete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './athlete.component.html',
  styleUrl: './athlete.component.css',
})
export class AthleteComponent {
  private authService = inject(AuthService);
  user: User | null = this.authService.getCurrentUser();

  logout() {
    this.authService.logout();
  }
}
