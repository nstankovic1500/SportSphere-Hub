import type { FacilityStatus, IGeoPoint, IOpeningHour } from '../../models/Facility';
import type { OrderStatus } from '../../models/Order';
import type { DiscountType } from '../../models/Promotion';
import type { ResourceType } from '../../models/Resource';
import type { UserRole, UserStatus } from '../../models/User';

interface EmployeeFavoriteSport {
  id: string;
  name: string;
}

interface EmployeeProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: EmployeeFavoriteSport[];
  employeeData: {
    companyName: string;
    headOfficeAddress: string;
    registrationNumber: string;
    pib: string;
  };
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

interface UpdateEmployeeProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  favoriteSports?: string[];
  employeeData?: {
    companyName?: string;
    headOfficeAddress?: string;
  };
}

interface EmployeeFacility {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  location: IGeoPoint;
  openingHours: IOpeningHour[];
  status: FacilityStatus;
  active: boolean;
  hourlyPrice: number;
  allowedNoShows: number;
  images: string[];
  sports: EmployeeFavoriteSport[];
  createdAt: Date;
}

interface CreateEmployeeFacilityBody {
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  sports?: string[];
  openingHours?: IOpeningHour[];
  hourlyPrice?: number;
  allowedNoShows?: number;
  images?: string[];
}

interface UpdateEmployeeFacilityBody {
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  sports?: string[];
  openingHours?: IOpeningHour[];
  hourlyPrice?: number;
  allowedNoShows?: number;
}

interface EmployeeResource {
  id: string;
  name: string;
  type: ResourceType;
  sport: EmployeeFavoriteSport;
  capacity: number;
  equipmentDescription: string;
  active: boolean;
}

interface CreateEmployeeResourceBody {
  name?: string;
  type?: ResourceType;
  sportId?: string;
  capacity?: number;
  equipmentDescription?: string;
}

interface UpdateEmployeeResourceBody {
  name?: string;
  type?: ResourceType;
  sportId?: string;
  capacity?: number;
  equipmentDescription?: string;
  active?: boolean;
}

interface EmployeeTrainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sports: EmployeeFavoriteSport[];
  workingHours: IOpeningHour[];
  biography: string;
  pricePerHour: number;
  active: boolean;
  createdAt: Date;
}

interface CreateEmployeeTrainerBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  sports?: string[];
  workingHours?: IOpeningHour[];
  biography?: string;
  pricePerHour?: number;
}

interface UpdateEmployeeTrainerBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  sports?: string[];
  workingHours?: IOpeningHour[];
  biography?: string;
  pricePerHour?: number;
  active?: boolean;
}

interface EmployeePromotion {
  id: string;
  name: string;
  sport: EmployeeFavoriteSport;
  startDate: Date;
  endDate: Date;
  discountType: DiscountType;
  discountValue: number;
  active: boolean;
  state: 'upcoming' | 'active' | 'expired' | 'inactive';
}

interface CreateEmployeePromotionBody {
  name?: string;
  sportId?: string;
  startDate?: string;
  endDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
}

interface UpdateEmployeePromotionBody {
  name?: string;
  sportId?: string;
  startDate?: string;
  endDate?: string;
  discountType?: DiscountType;
  discountValue?: number;
  active?: boolean;
}

interface EmployeeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  active: boolean;
}

interface EmployeeProductBody {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  image?: string;
  active?: boolean;
}

interface EmployeeOrder {
  id: string;
  athleteId: string;
  athleteName: string;
  facilityId: string;
  facilityName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
}

interface UpdateEmployeeOrderStatusBody {
  status?: OrderStatus;
}

export type {
  CreateEmployeeFacilityBody,
  EmployeeProductBody,
  CreateEmployeePromotionBody,
  CreateEmployeeResourceBody,
  CreateEmployeeTrainerBody,
  EmployeeFacility,
  EmployeeFavoriteSport,
  EmployeeOrder,
  EmployeeProfile,
  EmployeeProduct,
  EmployeePromotion,
  EmployeeResource,
  EmployeeTrainer,
  UpdateEmployeeFacilityBody,
  UpdateEmployeeOrderStatusBody,
  UpdateEmployeePromotionBody,
  UpdateEmployeeProfileBody,
  UpdateEmployeeResourceBody,
  UpdateEmployeeTrainerBody,
};
