import { Types } from 'mongoose';

import { Facility, FacilityStatus, type IFacility } from '../../models/Facility';
import { Promotion, type DiscountType } from '../../models/Promotion';
import { Resource, type ResourceType } from '../../models/Resource';
import { Review, ReviewReaction } from '../../models/Review';
import { AppError } from '../../utils/AppError';
import type {
  HomeResponse,
  PublicCitiesResponse,
  PublicComment,
  PublicFacilitiesQuery,
  PublicFacilitiesResponse,
  PublicFacilityDetailsResponse,
  PublicResource,
  PublicSport,
} from './public.types';

type PopulatedSport = {
  _id: Types.ObjectId;
  name: string;
};

type PopulatedFacility = Omit<IFacility, 'sports'> & {
  _id: Types.ObjectId;
  sports: PopulatedSport[];
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

const approvedActiveFacilityFilter = {
  status: FacilityStatus.Approved,
  active: true,
} as const;

const toSportSummary = (sport: PopulatedSport): PublicSport => ({
  id: sport._id.toString(),
  name: sport.name,
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

  const facilityIds = facilities.map((facility) => facility._id);
  const reviewStatsMap = await buildReviewStatsMap(facilityIds);

  return {
    facilities: facilities.map((facility) => {
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
        sports: facility.sports.map(toSportSummary),
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

  const [reviewStatsMap, resources, reviews] = await Promise.all([
    buildReviewStatsMap([facility._id]),
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
      sports: facility.sports.map(toSportSummary),
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

export {
  getCities,
  getFacilities,
  getFacilityById,
  getHomeData,
};
