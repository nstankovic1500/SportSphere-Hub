import { Types } from 'mongoose';

import { Ad, AdStatus, type IAd } from '../../models/Ad';
import { Request, RequestStatus, type IRequest } from '../../models/Request';
import { Sport } from '../../models/Sport';
import { AppError } from '../../utils/AppError';
import type {
  AdListItem,
  AdsQuery,
  AdBody,
  JoinRequestItem,
} from './ad.types';

type PopulatedAd = IAd & {
  _id: Types.ObjectId;
  authorId: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
  };
  sportId: {
    _id: Types.ObjectId;
    name: string;
  };
};

type PopulatedApplyRequest = IRequest & {
  _id: Types.ObjectId;
  athleteId: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
  };
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError('date must be in YYYY-MM-DD format', 400);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError('date must be in YYYY-MM-DD format', 400);
  }

  return date;
};

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const validateObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const validateTime = (value: string, fieldName: string) => {
  if (!timePattern.test(value)) {
    throw new AppError(`${fieldName} must be in HH:mm format`, 400);
  }
};

const ensureAdExists = async (id: string) => {
  validateObjectId(id, 'ad id');

  const ad = await Ad.findById(id);

  if (!ad) {
    throw new AppError('Ad not found', 404);
  }

  return ad;
};

const ensureApplyRequestExists = async (id: string) => {
  validateObjectId(id, 'join request id');

  const applyRequest = await Request.findById(id);

  if (!applyRequest) {
    throw new AppError('Join request not found', 404);
  }

  return applyRequest;
};

const toAdListItem = (
  ad: PopulatedAd,
  athleteId: string,
  requestedAdIds: Set<string>,
): AdListItem => {
  const adId = ad._id.toString();

  return {
    id: adId,
    authorId: ad.authorId._id.toString(),
    authorName: `${ad.authorId.firstName} ${ad.authorId.lastName}`.trim(),
    sport: {
      id: ad.sportId._id.toString(),
      name: ad.sportId.name,
    },
    city: ad.city,
    date: ad.date,
    startTime: ad.startTime,
    endTime: ad.endTime,
    missingPlayers: ad.missingPlayers,
    acceptedPlayers: ad.acceptedPlayers,
    status: ad.status,
    createdAt: ad.createdAt ?? new Date(),
    isOwner: ad.authorId._id.toString() === athleteId,
    hasRequested: requestedAdIds.has(adId),
  };
};

const toApplyRequestItem = (applyRequest: PopulatedApplyRequest): JoinRequestItem => {
  return {
    id: applyRequest._id.toString(),
    athleteName: `${applyRequest.athleteId.firstName} ${applyRequest.athleteId.lastName}`.trim(),
    status: applyRequest.status,
    createdAt: applyRequest.createdAt ?? new Date(),
  };
};

const getAds = async (athleteId: string, query: AdsQuery) => {
  const today = getTodayDateOnly();
  const filters: Record<string, unknown> = {
    status: AdStatus.Active,
    date: { $gte: today },
  };

  if (query.sportId) {
    validateObjectId(query.sportId, 'sport id');
    filters.sportId = new Types.ObjectId(query.sportId);
  }

  if (query.city) {
    filters.city = query.city.trim();
  }

  if (query.date) {
    filters.date = parseDateOnly(query.date);
  }

  const ads = (await Ad.find(filters)
    .populate({
      path: 'authorId',
      select: 'firstName lastName',
    })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .sort({ date: 1, startTime: 1 })
    .lean()) as unknown as PopulatedAd[];

  const adIds = ads.map((ad) => ad._id);
  const requests = await Request.find({
    adId: { $in: adIds },
    athleteId: new Types.ObjectId(athleteId),
  }).select('adId');

  const requestedAdIds = new Set(requests.map((request) => request.adId.toString()));

  return {
    ads: ads.map((ad) => toAdListItem(ad, athleteId, requestedAdIds)),
  };
};

const createAd = async (athleteId: string, body: AdBody) => {
  const sportId = String(body.sportId ?? '').trim();
  const city = String(body.city ?? '').trim();
  const dateText = String(body.date ?? '').trim();
  const startTime = String(body.startTime ?? '').trim();
  const endTime = String(body.endTime ?? '').trim();
  const missingPlayers = Number(body.missingPlayers);

  validateObjectId(sportId, 'sport id');

  const sport = await Sport.findOne({
    _id: new Types.ObjectId(sportId),
    active: true,
  });

  if (!sport) {
    throw new AppError('Sport not found', 404);
  }

  if (!city) {
    throw new AppError('city is required', 400);
  }

  const date = parseDateOnly(dateText);

  if (date.getTime() <= getTodayDateOnly().getTime()) {
    throw new AppError('date must be in the future', 400);
  }

  validateTime(startTime, 'startTime');
  validateTime(endTime, 'endTime');

  if (endTime <= startTime) {
    throw new AppError('endTime must be after startTime', 400);
  }

  if (!Number.isInteger(missingPlayers) || missingPlayers < 1) {
    throw new AppError('missingPlayers must be at least 1', 400);
  }

  const createdAd = await Ad.create({
    authorId: new Types.ObjectId(athleteId),
    sportId: new Types.ObjectId(sportId),
    city,
    date,
    startTime,
    endTime,
    missingPlayers,
    acceptedPlayers: 0,
    status: AdStatus.Active,
    createdAt: new Date(),
  });

  return {
    ad: {
      id: createdAd._id?.toString() ?? '',
    },
  };
};

const closeAd = async (athleteId: string, adId: string) => {
  const ad = await ensureAdExists(adId);

  if (!(ad.authorId.toString() === athleteId)) {
    throw new AppError('You do not have permission to access this ad', 403);
  }

  if (!(ad.status === AdStatus.Active)) {
    throw new AppError('Only active ads can be closed', 400);
  }

  ad.status = AdStatus.Closed;
  await ad.save();

  return {
    ad: {
      id: ad._id?.toString() ?? '',
      status: ad.status,
    },
  };
};

const applyToAd = async (athleteId: string, adId: string) => {
  const ad = await ensureAdExists(adId);

  if (ad.authorId.toString() === athleteId) {
    throw new AppError('You cannot join your own ad', 400);
  }

  if (!(ad.status === AdStatus.Active)) {
    throw new AppError('Ad is not active', 400);
  }

  const existingRequest = await Request.findOne({
    adId: ad._id,
    athleteId: new Types.ObjectId(athleteId),
  });

  if (existingRequest) {
    throw new AppError('You have already sent a join request for this ad', 400);
  }

  const applyRequest = await Request.create({
    adId: ad._id,
    athleteId: new Types.ObjectId(athleteId),
    status: RequestStatus.Pending,
    createdAt: new Date(),
  });

  return {
    request: {
      id: applyRequest._id?.toString() ?? '',
      status: applyRequest.status,
    },
  };
};

const getAdRequests = async (athleteId: string, adId: string) => {
  const ad = await ensureAdExists(adId);

  if (!(ad.authorId.toString() === athleteId)) {
    throw new AppError('You do not have permission to access this ad', 403);
  }

  const requests = (await Request.find({
    adId: ad._id,
  })
    .sort({ createdAt: -1 })
    .populate({
      path: 'athleteId',
      select: 'firstName lastName',
    })
    .lean()) as unknown as PopulatedApplyRequest[];

  return {
    requests: requests.map((request) => toApplyRequestItem(request)),
  };
};

const acceptApplyRequest = async (athleteId: string, applyRequestId: string) => {
  const applyRequest = await ensureApplyRequestExists(applyRequestId);
  const ad = await ensureAdExists(applyRequest.adId.toString());

  if (!(ad.authorId.toString() === athleteId)) {
    throw new AppError('You do not have permission to access this ad', 403);
  }

  if (!(applyRequest.status === RequestStatus.Pending)) {
    throw new AppError('Only pending join requests can be accepted', 400);
  }

  if (!(ad.status === AdStatus.Active)) {
    throw new AppError('Only active ads can accept join requests', 400);
  }

  if (ad.acceptedPlayers >= ad.missingPlayers) {
    throw new AppError('No more available spaces', 400);
  }

  applyRequest.status = RequestStatus.Accepted;
  ad.acceptedPlayers += 1;

  if (ad.acceptedPlayers === ad.missingPlayers) {
    ad.status = AdStatus.Completed;
  }

  await applyRequest.save();
  await ad.save();

  return {
    request: {
      id: applyRequest._id?.toString() ?? '',
      status: applyRequest.status,
    },
  };
};

const rejectApplyRequest = async (athleteId: string, applyRequestId: string) => {
  const applyRequest = await ensureApplyRequestExists(applyRequestId);
  const ad = await ensureAdExists(applyRequest.adId.toString());

  if (!(ad.authorId.toString() === athleteId)) {
    throw new AppError('You do not have permission to access this ad', 403);
  }

  if (!(applyRequest.status === RequestStatus.Pending)) {
    throw new AppError('Only pending join requests can be rejected', 400);
  }

  applyRequest.status = RequestStatus.Rejected;
  await applyRequest.save();

  return {
    request: {
      id: applyRequest._id?.toString() ?? '',
      status: applyRequest.status,
    },
  };
};

export {
  acceptApplyRequest,
  closeAd,
  createAd,
  getAdRequests,
  getAds,
  applyToAd,
  rejectApplyRequest,
};
