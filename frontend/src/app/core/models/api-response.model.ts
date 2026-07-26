import type { User } from './user.model';
import type { Sport } from './sport.model';
import type {
  AdminSportsResponseData,
  AdminTrainersResponseData,
  AdminUsersResponseData,
  ResolvedAdminSportResponseData,
  ResolvedAdminTrainerResponseData,
  ResolvedAdminUserResponseData,
  FacilityRequestsResponseData,
  RegistrationRequestsResponseData,
  ResolvedFacilityRequestResponseData,
  ResolvedRegistrationResponseData,
} from './admin.model';
import type {
  CitiesResponseData,
  FacilitiesResponseData,
  FacilityDetailsResponseData,
  FacilityReviewsResponseData,
  HomeResponseData,
  PublicProductResponseData,
  PublicProductsResponseData,
} from './public.model';
import type {
  AdCreateResponseData,
  AdListResponseData,
  AdRequestsResponseData,
  ApplyToAdResponseData,
} from './ad.model';
import type {
  CreateEmployeeFacilityRequest,
  EmployeeOrder,
  EmployeeAttendanceResponse,
  EmployeeCalendarResponse,
  EmployeeCalendarMoveResponse,
  EmployeeAttendanceUpdateResponse,
  EmployeeProduct,
  EmployeePromotion,
  CreateEmployeeResourceRequest,
  EmployeeFacility,
  EmployeeProfile,
  EmployeeResource,
  EmployeeTrainer,
} from './employee.model';
import type {
  AthleteCartResponseData,
  AthleteOrder,
} from './athlete.model';
import type {
  AthleteTrainingAppointment,
  TrainerAvailability,
  TrainerDetails,
  TrainerListItem,
} from './trainer.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface CurrentUserResponseData {
  user: User;
}

export interface ForgotPasswordResponseData {
  resetLink: string;
  expiresAt: string;
}

export interface SportsResponseData {
  sports: Sport[];
}

export type AdminRegistrationRequestsResponse =
  ApiResponse<RegistrationRequestsResponseData>;

export type AdminResolvedRegistrationResponse =
  ApiResponse<ResolvedRegistrationResponseData>;
export type AdminUsersApiResponse = ApiResponse<AdminUsersResponseData>;
export type AdminUserApiResponse = ApiResponse<ResolvedAdminUserResponseData>;
export type AdminFacilityRequestsResponse =
  ApiResponse<FacilityRequestsResponseData>;
export type AdminResolvedFacilityRequestResponse =
  ApiResponse<ResolvedFacilityRequestResponseData>;
export type AdminTrainersApiResponse = ApiResponse<AdminTrainersResponseData>;
export type AdminTrainerApiResponse = ApiResponse<ResolvedAdminTrainerResponseData>;
export type AdminSportsApiResponse = ApiResponse<AdminSportsResponseData>;
export type AdminSportApiResponse = ApiResponse<ResolvedAdminSportResponseData>;

export type PublicHomeApiResponse = ApiResponse<HomeResponseData>;
export type PublicCitiesApiResponse = ApiResponse<CitiesResponseData>;
export type PublicFacilitiesApiResponse = ApiResponse<FacilitiesResponseData>;
export type PublicFacilityDetailsApiResponse = ApiResponse<FacilityDetailsResponseData>;
export type PublicFacilityReviewsApiResponse = ApiResponse<FacilityReviewsResponseData>;
export type PublicProductsApiResponse = ApiResponse<PublicProductsResponseData>;
export type PublicProductApiResponse = ApiResponse<PublicProductResponseData>;
export type AdListApiResponse = ApiResponse<AdListResponseData>;
export type AdCreateApiResponse = ApiResponse<AdCreateResponseData>;
export type AdRequestsApiResponse = ApiResponse<AdRequestsResponseData>;
export type ApplyToAdApiResponse = ApiResponse<ApplyToAdResponseData>;
export type ForgotPasswordApiResponse = ApiResponse<ForgotPasswordResponseData>;
export type ResetPasswordApiResponse = ApiResponse<Record<string, never>>;
export type EmployeeProfileApiResponse = ApiResponse<{ employee: EmployeeProfile }>;
export type EmployeeFacilitiesApiResponse = ApiResponse<{ facilities: EmployeeFacility[] }>;
export type EmployeeCreatedFacilityApiResponse = ApiResponse<{ facility: EmployeeFacility }>;
export type EmployeeFacilityApiResponse = ApiResponse<{ facility: EmployeeFacility }>;
export type EmployeeResourcesApiResponse = ApiResponse<{ resources: EmployeeResource[] }>;
export type EmployeeCreatedResourceApiResponse = ApiResponse<{ resource: EmployeeResource }>;
export type EmployeeTrainersApiResponse = ApiResponse<{ trainers: EmployeeTrainer[] }>;
export type EmployeeCreatedTrainerApiResponse = ApiResponse<{ trainer: EmployeeTrainer }>;
export type EmployeeAttendanceApiResponse = ApiResponse<EmployeeAttendanceResponse>;
export type EmployeeAttendanceUpdateApiResponse = ApiResponse<EmployeeAttendanceUpdateResponse>;
export type EmployeeCalendarApiResponse = ApiResponse<EmployeeCalendarResponse>;
export type EmployeeCalendarMoveApiResponse = ApiResponse<EmployeeCalendarMoveResponse>;
export type EmployeeOrdersApiResponse = ApiResponse<{ orders: EmployeeOrder[] }>;
export type EmployeeOrderApiResponse = ApiResponse<{ order: EmployeeOrder }>;
export type EmployeeProductsApiResponse = ApiResponse<{ products: EmployeeProduct[] }>;
export type EmployeeProductApiResponse = ApiResponse<{ product: EmployeeProduct }>;
export type EmployeePromotionsApiResponse = ApiResponse<{ promotions: EmployeePromotion[] }>;
export type EmployeePromotionApiResponse = ApiResponse<{ promotion: EmployeePromotion }>;
export type UploadImageApiResponse = ApiResponse<{ imagePath: string }>;
export type UploadImagesApiResponse = ApiResponse<{ imagePaths: string[] }>;
export type PublicTrainersApiResponse = ApiResponse<{ trainers: TrainerListItem[] }>;
export type PublicTrainerApiResponse = ApiResponse<{ trainer: TrainerDetails }>;
export type TrainerAvailabilityApiResponse = ApiResponse<{ availability: TrainerAvailability }>;
export type AthleteTrainingAppointmentsApiResponse =
  ApiResponse<{ appointments: AthleteTrainingAppointment[] }>;
export type AthleteTrainingAppointmentApiResponse =
  ApiResponse<{ appointment: AthleteTrainingAppointment }>;
export type AthleteCartApiResponse = ApiResponse<AthleteCartResponseData>;
export type AthleteOrdersApiResponse = ApiResponse<{ orders: AthleteOrder[] }>;
export type AthleteOrderApiResponse = ApiResponse<{ order: AthleteOrder }>;
