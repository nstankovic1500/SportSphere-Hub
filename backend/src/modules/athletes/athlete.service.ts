import { Types } from 'mongoose';

import { Facility, FacilityStatus, type IOpeningHour } from '../../models/Facility';
import { Reservation, ReservationStatus, type IReservation } from '../../models/Reservation';
import { Resource, type IResource } from '../../models/Resource';
import { Sport, type ISport } from '../../models/Sport';
import { User, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  AthleteProfile,
  AthleteReservation,
  CreateReservationBody,
  ResourceAvailability,
  UpdateAthleteProfileBody,
} from './athlete.types';

const CAN_BE_CANCELLED = new Set<ReservationStatus>([
  ReservationStatus.Pending,
  ReservationStatus.Confirmed,
]);

type PopulatedSport = ISport & { _id: Types.ObjectId };

type AthleteUser = IUser & {
  _id: Types.ObjectId;
  favoriteSports?: PopulatedSport[];
};

type PopulatedReservation = IReservation & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    city: string;
  };
  resourceId: {
    _id: Types.ObjectId;
    name: string;
  };
  sportId: {
    _id: Types.ObjectId;
    name: string;
  };
};

type ResourceWithRefs = IResource & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    status: FacilityStatus;
    active: boolean;
    openingHours?: IOpeningHour[];
  };
  sportId: {
    _id: Types.ObjectId;
    name: string;
  };
};

const populateReservationRefs = (query: any) => {
  return query
    .populate({
      path: 'facilityId',
      select: 'name city',
    })
    .populate({
      path: 'resourceId',
      select: 'name',
    })
    .populate({
      path: 'sportId',
      select: 'name',
    });
};

const toAthleteProfile = (user: AthleteUser): AthleteProfile => {
  const favoriteSports =
    (user.favoriteSports ?? []) as PopulatedSport[];

  return {
    id: user._id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    profileImage: user.profileImage ?? 'profiles/default-avatar.png',
    favoriteSports: favoriteSports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    role: user.role,
    status: user.status,
    createdAt: user.createdAt ?? new Date(),
  };
};

const canCancelReservation = (
  reservation: Pick<IReservation, 'status' | 'startTime'>,
) => {
  if (!CAN_BE_CANCELLED.has(reservation.status)) {
    return false;
  }

  const hoursUntilStart =
    reservation.startTime.getTime() - new Date().getTime();

  return hoursUntilStart >= 12 * 60 * 60 * 1000;
};

const parseDateOnly = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('date must be in YYYY-MM-DD format', 400);
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError('date must be in YYYY-MM-DD format', 400);
  }

  return parsedDate;
};

const parseDateTime = (value: string | undefined, fieldName: string) => {
  if (!value) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return parsedDate;
};

const isOnFullHour = (date: Date) => {
  return (
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
};

const getDateKey = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const getOpeningHoursForDate = (openingHours: IOpeningHour[] | undefined, date: Date) => {
  const weekday = date.getUTCDay();
  const openingHour = (openingHours ?? []).find((item) => item.day === weekday);

  if (!openingHour) {
    throw new AppError('Facility is closed on the selected date', 400);
  }

  return openingHour;
};

const toDateTimeFromDayAndTime = (date: Date, time: string) => {
  return new Date(`${getDateKey(date)}T${time}:00.000Z`);
};

const getActiveResourceWithFacility = async (resourceId: string) => {
  if (!Types.ObjectId.isValid(resourceId)) {
    throw new AppError('Invalid resource id', 400);
  }

  const resource = (await Resource.findById(resourceId)
    .populate({
      path: 'facilityId',
      select: 'name status active openingHours',
    })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as ResourceWithRefs | null;

  if (!resource || !resource.active) {
    throw new AppError('Resource not found', 404);
  }

  if (
    !resource.facilityId ||
    !(resource.facilityId.status === FacilityStatus.Approved) ||
    !(resource.facilityId.active === true)
  ) {
    throw new AppError('Facility is not available for reservations', 400);
  }

  return resource;
};

const toAthleteReservation = (
  reservation: PopulatedReservation,
): AthleteReservation => {
  return {
    id: reservation._id.toString(),
    facilityName: reservation.facilityId.name,
    city: reservation.facilityId.city,
    resourceName: reservation.resourceId.name,
    sportName: reservation.sportId.name,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    canCancel: canCancelReservation(reservation),
  };
};

const getAthlete = async (athleteId: string) => {
  const user = (await User.findById(athleteId)
    .populate({
      path: 'favoriteSports',
      select: 'name',
    })
    .lean()) as unknown as AthleteUser | null;

  if (!user) {
    throw new AppError('Athlete not found', 404);
  }

  return user;
};

const getPopulatedReservation = async (
  reservationId: Types.ObjectId | string,
) => {
  return populateReservationRefs(Reservation.findById(reservationId)).lean();
};

const validateFavoriteSports = async (favoriteSports: unknown) => {
  if (!Array.isArray(favoriteSports)) {
    throw new AppError('favoriteSports must be an array', 400);
  }

  const uniqueIds = [...new Set(favoriteSports.map((sportId) => String(sportId).trim()).filter(Boolean))];

  if (uniqueIds.length > 5) {
    throw new AppError('favoriteSports can contain at most 5 items', 400);
  }

  for (const sportId of uniqueIds) {
    if (!Types.ObjectId.isValid(sportId)) {
      throw new AppError('favoriteSports must contain valid sport IDs', 400);
    }
  }

  if (uniqueIds.length === 0) {
    return [] as Types.ObjectId[];
  }

  const objectIds = uniqueIds.map((sportId) => new Types.ObjectId(sportId));
  const sports = await Sport.find({
    _id: { $in: objectIds },
    active: true,
  });

  if (sports.length !== objectIds.length) {
    throw new AppError('All favoriteSports must reference existing active sports', 400);
  }

  return objectIds;
};

const getProfile = async (athleteId: string) => {
  const user = await getAthlete(athleteId);

  return {
    athlete: toAthleteProfile(user),
  };
};

const updateProfile = async (
  athleteId: string,
  body: UpdateAthleteProfileBody,
) => {
  const user = await User.findById(athleteId);

  if (!user) {
    throw new AppError('Athlete not found', 404);
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!firstName) {
    throw new AppError('firstName is required', 400);
  }

  if (!lastName) {
    throw new AppError('lastName is required', 400);
  }

  if (!phone) {
    throw new AppError('phone is required', 400);
  }

  if (!email) {
    throw new AppError('email is required', 400);
  }

  const existingEmailUser = await User.findOne({
    email,
    _id: { $ne: user._id },
  });

  if (existingEmailUser) {
    throw new AppError('email already exists', 409);
  }

  const favoriteSports = await validateFavoriteSports(body.favoriteSports ?? []);

  user.firstName = firstName;
  user.lastName = lastName;
  user.phone = phone;
  user.email = email;
  user.favoriteSports = favoriteSports;

  await user.save();

  const updatedUser = await getAthlete(athleteId);

  return {
    athlete: toAthleteProfile(updatedUser),
  };
};

const getReservations = async (
  athleteId: string,
) => {
  const reservations = (await populateReservationRefs(
    Reservation.find({
      athleteId: new Types.ObjectId(athleteId),
    }),
  )
    .sort({ startTime: -1 })
    .lean()) as unknown as PopulatedReservation[];

  return {
    reservations: reservations.map((reservation) =>
      toAthleteReservation(reservation),
    ),
  };
};

const cancelReservation = async (
  athleteId: string,
  reservationId: string,
) => {
  if (!Types.ObjectId.isValid(reservationId)) {
    throw new AppError('Invalid reservation id', 400);
  }

  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  if (reservation.athleteId.toString() !== athleteId) {
    throw new AppError('You do not have permission to access this reservation', 403);
  }

  if (!CAN_BE_CANCELLED.has(reservation.status)) {
    throw new AppError('Only pending or confirmed reservations can be cancelled', 400);
  }

  if (!canCancelReservation(reservation)) {
    throw new AppError('Reservation can be cancelled only at least 12 hours before start time', 400);
  }

  reservation.status = ReservationStatus.Cancelled;
  await reservation.save();

  const updatedReservation = (await getPopulatedReservation(
    reservationId,
  )) as unknown as PopulatedReservation | null;

  if (!updatedReservation) {
    throw new AppError('Reservation not found', 404);
  }

  return {
    reservation: toAthleteReservation(updatedReservation),
  };
};

const getResourceAvailability = async (
  resourceId: string,
  date: string,
): Promise<{ availability: ResourceAvailability }> => {
  const parsedDate = parseDateOnly(date);
  const resource = await getActiveResourceWithFacility(resourceId);
  const openingHours = getOpeningHoursForDate(
    resource.facilityId.openingHours,
    parsedDate,
  );

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const reservations = await Reservation.find({
    resourceId: resource._id,
    status: { $ne: ReservationStatus.Cancelled },
    startTime: { $lt: dayEnd },
    endTime: { $gt: dayStart },
  })
    .sort({ startTime: 1 })
    .select('startTime endTime')
    .lean();

  return {
    availability: {
      resource: {
        id: resource._id.toString(),
        name: resource.name,
        facilityId: resource.facilityId._id.toString(),
        facilityName: resource.facilityId.name,
        sportId: resource.sportId._id.toString(),
        sportName: resource.sportId.name,
      },
      date,
      openingTime: openingHours.open,
      closingTime: openingHours.close,
      occupiedIntervals: reservations.map((reservation) => ({
        startTime: reservation.startTime,
        endTime: reservation.endTime,
      })),
    },
  };
};

const createReservation = async (
  athleteId: string,
  body: CreateReservationBody,
) => {
  const resourceId = String(body.resourceId ?? '').trim();
  const startTime = parseDateTime(body.startTime, 'startTime');
  const endTime = parseDateTime(body.endTime, 'endTime');

  const athlete = await User.findById(athleteId);

  if (!athlete) {
    throw new AppError('Athlete not found', 404);
  }

  const resource = await getActiveResourceWithFacility(resourceId);

  if ((athlete.blockedFacilities ?? []).some((facilityId) => facilityId.toString() === resource.facilityId._id.toString())) {
    throw new AppError('You are blocked in this facility', 403);
  }

  if (startTime.getTime() <= new Date().getTime()) {
    throw new AppError('Reservation must be in the future', 400);
  }

  if (!isOnFullHour(startTime) || !isOnFullHour(endTime)) {
    throw new AppError('startTime and endTime must be on full hours', 400);
  }

  if (endTime.getTime() <= startTime.getTime()) {
    throw new AppError('endTime must be after startTime', 400);
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  if (durationMs < 60 * 60 * 1000) {
    throw new AppError('Minimum reservation duration is 1 hour', 400);
  }

  if (getDateKey(startTime) !== getDateKey(endTime)) {
    throw new AppError('Reservation must start and end on the same date', 400);
  }

  const openingHours = getOpeningHoursForDate(
    resource.facilityId.openingHours,
    startTime,
  );
  const openingDateTime = toDateTimeFromDayAndTime(startTime, openingHours.open);
  const closingDateTime = toDateTimeFromDayAndTime(startTime, openingHours.close);

  if (
    startTime.getTime() < openingDateTime.getTime() ||
    endTime.getTime() > closingDateTime.getTime()
  ) {
    throw new AppError('Reservation must fit inside facility opening hours', 400);
  }

  const overlappingReservation = await Reservation.findOne({
    resourceId: resource._id,
    status: { $ne: ReservationStatus.Cancelled },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (overlappingReservation) {
    throw new AppError('Reservation overlaps with an existing reservation', 400);
  }

  const createdReservation = await Reservation.create({
    athleteId: athlete._id,
    facilityId: resource.facilityId._id,
    resourceId: resource._id,
    sportId: resource.sportId._id,
    startTime,
    endTime,
    status: ReservationStatus.Pending,
    createdAt: new Date(),
  });

  const reservation = (await getPopulatedReservation(
    createdReservation._id,
  )) as unknown as PopulatedReservation | null;

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  return {
    reservation: toAthleteReservation(reservation),
  };
};

export {
  cancelReservation,
  createReservation,
  getProfile,
  getReservations,
  getResourceAvailability,
  updateProfile,
};
