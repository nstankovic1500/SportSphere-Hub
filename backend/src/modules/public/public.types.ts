import type { DiscountType } from '../../models/Promotion';
import type { IGeoPoint, IOpeningHour } from '../../models/Facility';
import type { ResourceType } from '../../models/Resource';

interface PublicSport {
  id: string;
  name: string;
}

interface PublicResource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  equipmentDescription: string;
  sport: PublicSport | null;
}

interface PublicComment {
  id: string;
  comment: string;
  createdAt: Date;
}

interface TopFacilitty {
  id: string;
  name: string;
  city: string;
  country: string;
  image: string | null;
  likesCount: number;
}

interface HomePromotion {
  id: string;
  name: string;
  facilityName: string;
  startDate: Date;
  endDate: Date;
  discountType: DiscountType;
  discountValue: number;
}

interface HomeResponse {
  activeFacilitiesCount: number;
  topFacilities: TopFacilitty[];
  promotions: HomePromotion[];
}

interface PublicCitiesResponse {
  cities: string[];
}

interface PublicFacilityListItem {
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

interface PublicFacilitiesResponse {
  facilities: PublicFacilityListItem[];
}

interface PublicFacilityDetails {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  location: IGeoPoint;
  sports: PublicSport[];
  images: string[];
  openingHours: IOpeningHour[];
  hourlyPrice: number;
  likesCount: number;
  dislikesCount: number;
  resources: PublicResource[];
  comments: PublicComment[];
}

interface PublicFacilityDetailsResponse {
  facility: PublicFacilityDetails;
}

interface PublicFacilitiesQuery {
  name?: string;
  cities?: string;
  sportId?: string;
  resourceType?: 'outdoor' | 'indoor' | 'team_hall';
  availableToday?: string;
  sortBy?: 'name' | 'city';
  sortOrder?: 'asc' | 'desc';
}

interface PublicProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  facility: {
    id: string;
    name: string;
    city: string;
  };
}

interface PublicProductFacilityGroup {
  facility: {
    id: string;
    name: string;
    city: string;
  };
  products: PublicProduct[];
}

interface PublicProductsResponse {
  facilities: PublicProductFacilityGroup[];
}

interface PublicProductResponse {
  product: PublicProduct;
}

export type {
  HomePromotion,
  TopFacilitty,
  PublicCitiesResponse,
  PublicComment,
  PublicFacilitiesQuery,
  PublicFacilitiesResponse,
  PublicFacilityDetails,
  PublicFacilityDetailsResponse,
  PublicFacilityListItem,
  PublicProduct,
  PublicProductFacilityGroup,
  PublicProductResponse,
  PublicProductsResponse,
  PublicSport,
  HomeResponse,
  PublicResource,
};
