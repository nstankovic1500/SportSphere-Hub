import { Types } from 'mongoose';

import { Appointment, AppointmentStatus } from '../../models/Appointment';
import { Facility, FacilityStatus, type IFacility } from '../../models/Facility';
import { Promotion, type DiscountType } from '../../models/Promotion';
import { Product, type IProduct } from '../../models/Product';
import { Reservation, ReservationStatus } from '../../models/Reservation';
import { Resource, type ResourceType } from '../../models/Resource';
import { Review, ReviewReaction } from '../../models/Review';
import { Sport } from '../../models/Sport';
import { AppError } from '../../utils/AppError';
import type {
  HomeResponse,
  PublicCitiesResponse,
  PublicComment,
  PublicFacilitiesQuery,
  PublicFacilitiesResponse,
  PublicFacilityDetailsResponse,
  PublicProduct,
  PublicProductsResponse,
  PublicResource,
  PublicSport,
} from './public.types';

type PopulatedSport = {
  _id: Types.ObjectId;
  name: string;
};

type PopulatedFacility = Omit<IFacility, 'sports'> & {
  _id: Types.ObjectId;
  sports: Array<PopulatedSport | Types.ObjectId | string>;
};

type PopulatedResource = {
  _id: Types.ObjectId;
  name: string;
  type: ResourceType;
  capacity: number;
  equipmentDescription: string;
  sportId: PopulatedSport | null;
};

type PopulatedPromotion = {
  _id: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  discountType: DiscountType;
  discountValue: number;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    status: FacilityStatus;
    active: boolean;
  } | null;
};

type PublicProductDocument = IProduct & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    city: string;
    status: FacilityStatus;
    active: boolean;
  } | null;
};

const approvedActiveFacilityFilter = {
  status: FacilityStatus.Approved,
  active: true,
} as const;

const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.Pending,
  ReservationStatus.Confirmed,
];

const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.Scheduled];

const toSportSummary = (sport: PopulatedSport): PublicSport => ({
  id: sport._id.toString(),
  name: sport.name,
});

const getSportIdsFromFacility = (facility: PopulatedFacility) =>
  (facility.sports ?? [])
    .map((sport) => {
      if (sport instanceof Types.ObjectId) {
        return sport.toString();
      }

      if (typeof sport === 'string') {
        return sport;
      }

      return sport._id.toString();
    })
    .filter(Boolean);

const buildSportMap = async (facilities: PopulatedFacility[]) => {
  const sportIds = Array.from(
    new Set(
      facilities.flatMap((facility) => getSportIdsFromFacility(facility)),
    ),
  );

  if (sportIds.length === 0) {
    return new Map<string, PublicSport>();
  }

  const sports = await Sport.find({
    _id: {
      $in: sportIds
        .filter((sportId) => Types.ObjectId.isValid(sportId))
        .map((sportId) => new Types.ObjectId(sportId)),
    },
  })
    .select('name')
    .lean();

  return new Map(
    sports.map((sport) => [
      (sport._id as Types.ObjectId).toString(),
      {
        id: (sport._id as Types.ObjectId).toString(),
        name: sport.name,
      },
    ]),
  );
};

const getMappedFacilitySports = (
  facility: PopulatedFacility,
  sportMap: Map<string, PublicSport>,
) =>
  getSportIdsFromFacility(facility)
    .map((sportId) => sportMap.get(sportId))
    .filter((sport): sport is PublicSport => !!sport);

const getOpeningHoursForDate = (
  facility: Pick<IFacility, 'openingHours'>,
  date: Date,
) => {
  const weekday = date.getDay();

  return (facility.openingHours ?? []).find((item) => item.day === weekday) ?? null;
};

const toDateTimeFromDayAndTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);

  return result;
};

const getNextFullHour = (date: Date) => {
  const result = new Date(date);

  if (
    result.getMinutes() === 0 &&
    result.getSeconds() === 0 &&
    result.getMilliseconds() === 0
  ) {
    return result;
  }

  result.setHours(result.getHours() + 1, 0, 0, 0);
  return result;
};

const hasAvailableSlotToday = async (facilities: PopulatedFacility[]) => {
  if (facilities.length === 0) {
    return new Set<string>();
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const facilityIds = facilities.map((facility) => facility._id);
  const resources = await Resource.find({
    facilityId: { $in: facilityIds },
    active: true,
  })
    .select('facilityId')
    .lean();

  if (resources.length === 0) {
    return new Set<string>();
  }

  const resourceIds = resources.map((resource) => resource._id as Types.ObjectId);

  const [reservations, appointments] = await Promise.all([
    Reservation.find({
      resourceId: { $in: resourceIds },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      startTime: { $lt: endOfDay },
      endTime: { $gt: now },
    })
      .select('resourceId startTime endTime')
      .lean(),
    Appointment.find({
      resourceId: { $in: resourceIds },
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
      startTime: { $lt: endOfDay },
      endTime: { $gt: now },
    })
      .select('resourceId startTime endTime')
      .lean(),
  ]);

  const busyIntervalsByResource = new Map<
    string,
    Array<{ startTime: Date; endTime: Date }>
  >();

  for (const interval of [...reservations, ...appointments]) {
    const resourceId = (interval.resourceId as Types.ObjectId).toString();
    const currentIntervals = busyIntervalsByResource.get(resourceId) ?? [];

    currentIntervals.push({
      startTime: new Date(interval.startTime),
      endTime: new Date(interval.endTime),
    });

    busyIntervalsByResource.set(resourceId, currentIntervals);
  }

  const resourcesByFacility = new Map<string, string[]>();

  for (const resource of resources) {
    const facilityId = (resource.facilityId as Types.ObjectId).toString();
    const currentResourceIds = resourcesByFacility.get(facilityId) ?? [];

    currentResourceIds.push((resource._id as Types.ObjectId).toString());
    resourcesByFacility.set(facilityId, currentResourceIds);
  }

  const availableFacilityIds = new Set<string>();

  for (const facility of facilities) {
    const facilityId = facility._id.toString();
    const openingHours = getOpeningHoursForDate(facility, now);

    if (!openingHours) {
      continue;
    }

    const resourceIdsForFacility = resourcesByFacility.get(facilityId) ?? [];

    if (resourceIdsForFacility.length === 0) {
      continue;
    }

    const openingDateTime = toDateTimeFromDayAndTime(now, openingHours.open);
    const closingDateTime = toDateTimeFromDayAndTime(now, openingHours.close);
    let candidateStart = getNextFullHour(now);

    if (candidateStart < openingDateTime) {
      candidateStart = openingDateTime;
    }

    if (candidateStart >= closingDateTime) {
      continue;
    }

    for (const resourceId of resourceIdsForFacility) {
      const intervals = (busyIntervalsByResource.get(resourceId) ?? []).sort(
        (first, second) => first.startTime.getTime() - second.startTime.getTime(),
      );

      let currentStart = new Date(candidateStart);

      for (const interval of intervals) {
        const currentEnd = new Date(currentStart.getTime() + 60 * 60 * 1000);

        if (currentEnd <= interval.startTime) {
          break;
        }

        if (currentStart < interval.endTime && currentEnd > interval.startTime) {
          currentStart = getNextFullHour(interval.endTime);
        }
      }

      if (currentStart.getTime() + 60 * 60 * 1000 <= closingDateTime.getTime()) {
        availableFacilityIds.add(facilityId);
        break;
      }
    }
  }

  return availableFacilityIds;
};

const toPublicProduct = (product: PublicProductDocument): PublicProduct => ({
  id: product._id.toString(),
  name: product.name,
  description: product.description,
  price: product.price,
  stock: product.stock,
  category: product.category,
  image: product.image ?? null,
  facility: {
    id: product.facilityId!._id.toString(),
    name: product.facilityId!.name,
    city: product.facilityId!.city,
  },
});

const buildReviewStatsMap = async (facilityIds: Types.ObjectId[]) => {
  if (facilityIds.length === 0) {
    return new Map<string, { likesCount: number; dislikesCount: number }>();
  }

  const stats = await Review.aggregate<{
    _id: Types.ObjectId;
    likesCount: number;
    dislikesCount: number;
  }>([
    {
      $match: {
        facilityId: { $in: facilityIds },
      },
    },
    {
      $group: {
        _id: '$facilityId',
        likesCount: {
          $sum: {
            $cond: [{ $eq: ['$reaction', ReviewReaction.Like] }, 1, 0],
          },
        },
        dislikesCount: {
          $sum: {
            $cond: [{ $eq: ['$reaction', ReviewReaction.Dislike] }, 1, 0],
          },
        },
      },
    },
  ]);

  return new Map(
    stats.map((stat) => [
      stat._id.toString(),
      {
        likesCount: stat.likesCount,
        dislikesCount: stat.dislikesCount,
      },
    ]),
  );
};

const getHomeData = async (): Promise<HomeResponse> => {
  const now = new Date();

  const [activeFacilitiesCount, facilities, promotions] = await Promise.all([
    Facility.countDocuments(approvedActiveFacilityFilter),
    Facility.find(approvedActiveFacilityFilter)
      .select('name city country images')
      .lean(),
    Promotion.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate({
        path: 'facilityId',
        select: 'name status active',
      })
      .sort({ startDate: 1 })
      .lean(),
  ]);

  const facilityIds = facilities.map(
    (facility) => facility._id as Types.ObjectId,
  );
  const reviewStatsMap = await buildReviewStatsMap(facilityIds);

  const topFacilities = facilities
    .map((facility) => {
      const id = (facility._id as Types.ObjectId).toString();
      const stats = reviewStatsMap.get(id) ?? {
        likesCount: 0,
        dislikesCount: 0,
      };

      return {
        id,
        name: facility.name,
        city: facility.city,
        country: facility.country,
        image: facility.images?.[0] ?? null,
        likesCount: stats.likesCount,
      };
    })
    .sort(
      (first, second) =>
        second.likesCount - first.likesCount ||
        first.name.localeCompare(second.name),
    )
    .slice(0, 3);

  const activePromotions = (promotions as unknown as PopulatedPromotion[])
    .filter(
      (promotion) =>
        promotion.facilityId?.status === FacilityStatus.Approved &&
        promotion.facilityId.active,
    )
    .slice(0, 3)
    .map((promotion) => ({
      id: promotion._id.toString(),
      name: promotion.name,
      facilityName: promotion.facilityId!.name,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
    }));

  return {
    activeFacilitiesCount,
    topFacilities,
    promotions: activePromotions,
  };
};

const getCities = async (): Promise<PublicCitiesResponse> => {
  const cities = await Facility.distinct(
    'city',
    approvedActiveFacilityFilter,
  );

  return {
    cities: cities.sort((first, second) => first.localeCompare(second)),
  };
};

const getFacilities = async (
  query: PublicFacilitiesQuery,
): Promise<PublicFacilitiesResponse> => {
  const filter: Record<string, unknown> = {
    ...approvedActiveFacilityFilter,
  };

  if (query.name?.trim()) {
    filter.name = {
      $regex: query.name.trim(),
      $options: 'i',
    };
  }

  if (query.cities?.trim()) {
    const cities = query.cities
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean);

    if (cities.length > 0) {
      filter.city = { $in: cities };
    }
  }

  if (query.sportId?.trim()) {
    const sportId = query.sportId.trim();

    if (!Types.ObjectId.isValid(sportId)) {
      throw new AppError('Invalid sport id', 400);
    }

    filter.sports = new Types.ObjectId(sportId);
  }

  if (query.resourceType) {
    const facilityIds = await Resource.find({
      type: query.resourceType,
      active: true,
    }).distinct('facilityId');

    filter._id = { $in: facilityIds };
  }

  const sortField = query.sortBy === 'city' ? 'city' : 'name';
  const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

  const facilities = (await Facility.find(filter)
    .populate({
      path: 'sports',
      select: 'name',
    })
    .sort({ [sortField]: sortDirection })
    .lean()) as unknown as PopulatedFacility[];

  const availableFacilityIds =
    query.availableToday === 'true'
      ? await hasAvailableSlotToday(facilities)
      : null;

  const finalFacilities =
    availableFacilityIds === null
      ? facilities
      : facilities.filter((facility) =>
          availableFacilityIds.has(facility._id.toString()),
        );

  const facilityIds = finalFacilities.map((facility) => facility._id);
  const [reviewStatsMap, sportMap] = await Promise.all([
    buildReviewStatsMap(facilityIds),
    buildSportMap(finalFacilities),
  ]);

  return {
    facilities: finalFacilities.map((facility) => {
      const id = facility._id.toString();
      const stats = reviewStatsMap.get(id) ?? {
        likesCount: 0,
        dislikesCount: 0,
      };

      return {
        id,
        name: facility.name,
        city: facility.city,
        country: facility.country,
        address: facility.address,
        sports: getMappedFacilitySports(facility, sportMap),
        hourlyPrice: facility.hourlyPrice,
        image: facility.images?.[0] ?? null,
        likesCount: stats.likesCount,
        dislikesCount: stats.dislikesCount,
      };
    }),
  };
};

const getFacilityById = async (
  id: string,
): Promise<PublicFacilityDetailsResponse> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid facility id', 400);
  }

  const facility = (await Facility.findOne({
    _id: new Types.ObjectId(id),
    ...approvedActiveFacilityFilter,
  })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean()) as PopulatedFacility | null;

  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  const [reviewStatsMap, sportMap, resources, reviews] = await Promise.all([
    buildReviewStatsMap([facility._id]),
    buildSportMap([facility]),
    Resource.find({
      facilityId: facility._id,
      active: true,
    })
      .populate({
        path: 'sportId',
        select: 'name',
      })
      .lean(),
    Review.find({
      facilityId: facility._id,
      comment: { $ne: '' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const stats = reviewStatsMap.get(facility._id.toString()) ?? {
    likesCount: 0,
    dislikesCount: 0,
  };

  const mappedResources: PublicResource[] = (
    resources as unknown as PopulatedResource[]
  ).map((resource) => ({
    id: resource._id.toString(),
    name: resource.name,
    type: resource.type,
    capacity: resource.capacity,
    equipmentDescription: resource.equipmentDescription,
    sport: resource.sportId
      ? toSportSummary(resource.sportId)
      : null,
  }));

  const comments: PublicComment[] = reviews.map((review) => ({
    id: (review._id as Types.ObjectId).toString(),
    comment: review.comment,
    createdAt: review.createdAt ?? new Date(),
  }));

  return {
    facility: {
      id: facility._id.toString(),
      name: facility.name,
      city: facility.city,
      country: facility.country,
      address: facility.address,
      description: facility.description,
      location: facility.location,
      sports: getMappedFacilitySports(facility, sportMap),
      images: facility.images ?? [],
      openingHours: facility.openingHours ?? [],
      hourlyPrice: facility.hourlyPrice,
      likesCount: stats.likesCount,
      dislikesCount: stats.dislikesCount,
      resources: mappedResources,
      comments,
    },
  };
};

const getProducts = async (): Promise<PublicProductsResponse> => {
  const products = (await Product.find({
    active: true,
  })
    .populate({
      path: 'facilityId',
      select: 'name city status active',
    })
    .sort({ name: 1 })
    .lean()) as unknown as PublicProductDocument[];

  const groupedProducts = new Map<
    string,
    { facility: PublicProduct['facility']; products: PublicProduct[] }
  >();

  for (const product of products) {
    if (
      !product.facilityId ||
      product.facilityId.status !== FacilityStatus.Approved ||
      product.facilityId.active !== true
    ) {
      continue;
    }

    const mappedProduct = toPublicProduct(product);
    const existingGroup = groupedProducts.get(mappedProduct.facility.id);

    if (existingGroup) {
      existingGroup.products.push(mappedProduct);
    } else {
      groupedProducts.set(mappedProduct.facility.id, {
        facility: mappedProduct.facility,
        products: [mappedProduct],
      });
    }
  }

  return {
    facilities: Array.from(groupedProducts.values()).sort((first, second) =>
      first.facility.name.localeCompare(second.facility.name),
    ),
  };
};

const getProductById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid product id', 400);
  }

  const product = (await Product.findById(id)
    .populate({
      path: 'facilityId',
      select: 'name city status active',
    })
    .lean()) as unknown as PublicProductDocument | null;

  if (!product || !product.active) {
    throw new AppError('Product not found', 404);
  }

  if (
    !product.facilityId ||
    product.facilityId.status !== FacilityStatus.Approved ||
    product.facilityId.active !== true
  ) {
    throw new AppError('Product not found', 404);
  }

  return {
    product: toPublicProduct(product),
  };
};

export {
  getCities,
  getFacilities,
  getFacilityById,
  getHomeData,
  getProductById,
  getProducts,
};
