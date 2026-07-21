import type { User } from './user.model';
import type { Sport } from './sport.model';
import type {
  RegistrationRequestsResponseData,
  ResolvedRegistrationResponseData,
} from './admin.model';
import type {
  CitiesResponseData,
  FacilitiesResponseData,
  FacilityDetailsResponseData,
  HomeResponseData,
} from './public.model';

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

export type PublicHomeApiResponse = ApiResponse<HomeResponseData>;
export type PublicCitiesApiResponse = ApiResponse<CitiesResponseData>;
export type PublicFacilitiesApiResponse = ApiResponse<FacilitiesResponseData>;
export type PublicFacilityDetailsApiResponse = ApiResponse<FacilityDetailsResponseData>;
