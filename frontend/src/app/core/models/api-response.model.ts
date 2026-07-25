import type { User } from './user.model';
import type { Sport } from './sport.model';
import type {
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
} from './public.model';
import type {
  AdCreateResponseData,
  AdListResponseData,
  AdRequestsResponseData,
  ApplyToAdResponseData,
} from './ad.model';
import type {
  CreateEmployeeFacilityRequest,
  CreateEmployeeResourceRequest,
  EmployeeFacility,
  EmployeeProfile,
  EmployeeResource,
} from './employee.model';

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

export interface SportsResponseData {
  sports: Sport[];
}

export type AdminRegistrationRequestsResponse =
  ApiResponse<RegistrationRequestsResponseData>;

export type AdminResolvedRegistrationResponse =
  ApiResponse<ResolvedRegistrationResponseData>;
export type AdminFacilityRequestsResponse =
  ApiResponse<FacilityRequestsResponseData>;
export type AdminResolvedFacilityRequestResponse =
  ApiResponse<ResolvedFacilityRequestResponseData>;

export type PublicHomeApiResponse = ApiResponse<HomeResponseData>;
export type PublicCitiesApiResponse = ApiResponse<CitiesResponseData>;
export type PublicFacilitiesApiResponse = ApiResponse<FacilitiesResponseData>;
export type PublicFacilityDetailsApiResponse = ApiResponse<FacilityDetailsResponseData>;
export type PublicFacilityReviewsApiResponse = ApiResponse<FacilityReviewsResponseData>;
export type AdListApiResponse = ApiResponse<AdListResponseData>;
export type AdCreateApiResponse = ApiResponse<AdCreateResponseData>;
export type AdRequestsApiResponse = ApiResponse<AdRequestsResponseData>;
export type ApplyToAdApiResponse = ApiResponse<ApplyToAdResponseData>;
export type EmployeeProfileApiResponse = ApiResponse<{ employee: EmployeeProfile }>;
export type EmployeeFacilitiesApiResponse = ApiResponse<{ facilities: EmployeeFacility[] }>;
export type EmployeeCreatedFacilityApiResponse = ApiResponse<{ facility: EmployeeFacility }>;
export type EmployeeFacilityApiResponse = ApiResponse<{ facility: EmployeeFacility }>;
export type EmployeeResourcesApiResponse = ApiResponse<{ resources: EmployeeResource[] }>;
export type EmployeeCreatedResourceApiResponse = ApiResponse<{ resource: EmployeeResource }>;
