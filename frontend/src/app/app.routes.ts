import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { AdminComponent } from './components/admin/admin.component';
import { RegistrationRequestsComponent } from './components/admin/registration-requests/registration-requests.component';
import { FacilityRequestsComponent } from './components/admin/facility-requests/facility-requests.component';
import { AdminUsersComponent } from './components/admin/users/admin-users.component';
import { AdminTrainersComponent } from './components/admin/trainers/admin-trainers.component';
import { AdminSportsComponent } from './components/admin/sports/admin-sports.component';
import { AthleteProfileComponent } from './components/athlete/profile/athlete-profile.component';
import { ReservationComponent } from './components/athlete/reservation/reservation.component';
import { AdListComponent } from './components/athlete/ads/ad-list.component';
import { CreateAdComponent } from './components/athlete/ads/create-ad.component';
import { AdRequestsComponent } from './components/athlete/ads/ad-requests.component';
import { AthleteCartComponent } from './components/athlete/cart/athlete-cart.component';
import { AthleteOrdersComponent } from './components/athlete/orders/athlete-orders.component';
import { AthleteShopComponent } from './components/athlete/shop/athlete-shop.component';
import { AthleteTrainersComponent } from './components/athlete/trainers/athlete-trainers.component';
import { TrainerBookingComponent } from './components/athlete/trainers/trainer-booking.component';
import { AthleteTrainingsComponent } from './components/athlete/trainings/athlete-trainings.component';
import { FacilityDetailsComponent } from './components/public/facility-details/facility-details.component';
import { FacilitiesComponent } from './components/public/facilities/facilities.component';
import { HomeComponent } from './components/public/home/home.component';
import { AthleteComponent } from './components/athlete/athlete.component';
import { EmployeeComponent } from './components/employee/employee.component';
import { EmployeeProfileComponent } from './components/employee/profile/employee-profile.component';
import { CreateFacilityComponent } from './components/employee/facilities/create-facility.component';
import { EmployeeFacilityDetailsComponent } from './components/employee/facilities/employee-facility-details.component';
import { EditFacilityComponent } from './components/employee/facilities/edit-facility.component';
import { EmployeeAttendanceComponent } from './components/employee/attendance/employee-attendance.component';
import { EmployeeCalendarComponent } from './components/employee/calendar/employee-calendar.component';
import { EmployeeResourcesComponent } from './components/employee/resources/employee-resources.component';
import { EmployeeResourceFormComponent } from './components/employee/resources/employee-resource-form.component';
import { EmployeePromotionsComponent } from './components/employee/promotions/employee-promotions.component';
import { PromotionFormComponent } from './components/employee/promotions/promotion-form.component';
import { EmployeeProductsComponent } from './components/employee/products/employee-products.component';
import { ProductFormComponent } from './components/employee/products/product-form.component';
import { EmployeeOrdersComponent } from './components/employee/orders/employee-orders.component';
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
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
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
    path: 'athlete/shop',
    component: AthleteShopComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/cart',
    component: AthleteCartComponent,
    canActivate: [authGuard],
    data: {
      roles: ['athlete'],
    },
  },
  {
    path: 'athlete/orders',
    component: AthleteOrdersComponent,
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
    redirectTo: 'employee/profile',
    pathMatch: 'full',
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
    path: 'employee/facilities/:facilityId/attendance',
    component: EmployeeAttendanceComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/calendar',
    component: EmployeeCalendarComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/orders',
    component: EmployeeOrdersComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/promotions',
    component: EmployeePromotionsComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/promotions/new',
    component: PromotionFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/promotions/:promotionId/edit',
    component: PromotionFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/products',
    component: EmployeeProductsComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/products/new',
    component: ProductFormComponent,
    canActivate: [authGuard],
    data: {
      roles: ['employee'],
    },
  },
  {
    path: 'employee/facilities/:facilityId/products/:productId/edit',
    component: ProductFormComponent,
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
    path: 'admin/users',
    component: AdminUsersComponent,
    canActivate: [authGuard],
    data: {
      roles: ['admin'],
    },
  },
  {
    path: 'admin/trainers',
    component: AdminTrainersComponent,
    canActivate: [authGuard],
    data: {
      roles: ['admin'],
    },
  },
  {
    path: 'admin/sports',
    component: AdminSportsComponent,
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
