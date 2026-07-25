import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { RegistrationRequestsComponent } from './components/admin/registration-requests/registration-requests.component';
import { FacilityRequestsComponent } from './components/admin/facility-requests/facility-requests.component';
import { AthleteProfileComponent } from './components/athlete/profile/athlete-profile.component';
import { ReservationComponent } from './components/athlete/reservation/reservation.component';
import { AdListComponent } from './components/athlete/ads/ad-list.component';
import { CreateAdComponent } from './components/athlete/ads/create-ad.component';
import { AdRequestsComponent } from './components/athlete/ads/ad-requests.component';
import { AthleteTrainersComponent } from './components/athlete/trainers/athlete-trainers.component';
import { TrainerBookingComponent } from './components/athlete/trainers/trainer-booking.component';
import { AthleteTrainingsComponent } from './components/athlete/trainings/athlete-trainings.component';
import { FacilityDetailsComponent } from './components/public/facility-details/facility-details.component';
import { FacilitiesComponent } from './components/public/facilities/facilities.component';
import { HomeComponent } from './components/public/home/home.component';
import { AthleteComponent } from './components/athlete/athlete.component';
import { EmployeeComponent } from './components/employee/employee.component';
import { EmployeeProfileComponent } from './components/employee/profile/employee-profile.component';
import { EmployeeFacilitiesComponent } from './components/employee/facilities/employee-facilities.component';
import { CreateFacilityComponent } from './components/employee/facilities/create-facility.component';
import { EmployeeFacilityDetailsComponent } from './components/employee/facilities/employee-facility-details.component';
import { EditFacilityComponent } from './components/employee/facilities/edit-facility.component';
import { EmployeeResourcesComponent } from './components/employee/resources/employee-resources.component';
import { EmployeeResourceFormComponent } from './components/employee/resources/employee-resource-form.component';
import { EmployeeTrainersComponent } from './components/employee/trainers/employee-trainers.component';
import { TrainerFormComponent } from './components/employee/trainers/trainer-form.component';

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
    path: 'athlete/profile',
    component: AthleteProfileComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/ads',
    component: AdListComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/ads/new',
    component: CreateAdComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/ads/:id/requests',
    component: AdRequestsComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/facilities/:facilityId/reserve',
    component: ReservationComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/trainers',
    component: AthleteTrainersComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/trainers/:trainerId',
    component: TrainerBookingComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/trainings',
    component: AthleteTrainingsComponent,
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
    path: 'employee/profile',
    component: EmployeeProfileComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities',
    component: EmployeeFacilitiesComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/new',
    component: CreateFacilityComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId',
    component: EmployeeFacilityDetailsComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/edit',
    component: EditFacilityComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/resources',
    component: EmployeeResourcesComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/resources/new',
    component: EmployeeResourceFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/resources/:resourceId/edit',
    component: EmployeeResourceFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/trainers',
    component: EmployeeTrainersComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/trainers/new',
    component: TrainerFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/trainers/:trainerId/edit',
    component: TrainerFormComponent,
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
    path: 'admin/facility-requests',
    component: FacilityRequestsComponent,
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
