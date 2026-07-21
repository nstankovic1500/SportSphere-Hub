export interface PublicSport {
  id: string;
  name: string;
}

export interface HomeFacility {
  id: string;
  name: string;
  city: string;
  country: string;
  image: string | null;
  likesCount: number;
}

export interface HomePromotion {
  id: string;
  name: string;
  facilityName: string;
  startDate: string;
  endDate: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface HomeResponseData {
  activeFacilitiesCount: number;
  topFacilities: HomeFacility[];
  promotions: HomePromotion[];
}

export interface CitiesResponseData {
  cities: string[];
}

export interface FacilityListItem {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  sports: PublicSport[];
  hourlyPrice: number;
  image: string | null;
  likesCount: number;
  dislikesCount: number;
}

export interface FacilitiesResponseData {
  facilities: FacilityListItem[];
}

export interface FacilityComment {
  id: string;
  comment: string;
  createdAt: string;
}

export interface FacilityResource {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'team_hall';
  capacity: number;
  equipmentDescription: string;
  sport: PublicSport | null;
}

export interface FacilityOpeningHour {
  day: number;
  open: string;
  close: string;
}

export interface FacilityLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface FacilityDetails {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  location: FacilityLocation;
  sports: PublicSport[];
  images: string[];
  openingHours: FacilityOpeningHour[];
  hourlyPrice: number;
  likesCount: number;
  dislikesCount: number;
  resources: FacilityResource[];
  comments: FacilityComment[];
}

export interface FacilityDetailsResponseData {
  facility: FacilityDetails;
}

export interface FacilitiesQueryParams {
  name?: string;
  cities?: string;
  sportId?: string;
  resourceType?: 'outdoor' | 'indoor' | 'team_hall';
  sortBy?: 'name' | 'city';
  sortOrder?: 'asc' | 'desc';
}
