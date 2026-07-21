import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { RegistrationRequestsComponent } from './components/admin/registration-requests/registration-requests.component';
import { FacilityDetailsComponent } from './components/public/facility-details/facility-details.component';
import { FacilitiesComponent } from './components/public/facilities/facilities.component';
import { HomeComponent } from './components/public/home/home.component';
import { AthleteComponent } from './components/athlete/athlete.component';
import { EmployeeComponent } from './components/employee/employee.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'facilities',
    component: FacilitiesComponent,
  },
  {
    path: 'facilities/:id',
    component: FacilityDetailsComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent,
  },
  {
    path: 'athlete',
    component: AthleteComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'employee',
    component: EmployeeComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
    data: {
      roles: ['admin'],
    },
  },
  {
    path: 'admin/registration-requests',
    component: RegistrationRequestsComponent,
    canActivate: [authGuard],
    data: {
      roles: ['admin'],
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
