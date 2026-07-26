import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get isLoginScreen() {
    return this.router.url === '/login';
  }

  logout() {
    this.authService.logout();
  }
}
