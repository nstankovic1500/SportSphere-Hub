import { Types } from 'mongoose';

import { Reservation, ReservationStatus, type IReservation } from '../../models/Reservation';
import { Sport, type ISport } from '../../models/Sport';
import { User, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  AthleteProfile,
  AthleteReservation,
  UpdateAthleteProfileBody,
} from './athlete.types';

const CURRENT_DATE = new Date('2026-07-21T00:00:00.000Z');
const CANCELLABLE_STATUSES = new Set<ReservationStatus>([
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
  if (!CANCELLABLE_STATUSES.has(reservation.status)) {
    return false;
  }

  const hoursUntilStart =
    reservation.startTime.getTime() - CURRENT_DATE.getTime();

  return hoursUntilStart >= 12 * 60 * 60 * 1000;
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
  const reservations = (await Reservation.find({
    athleteId: new Types.ObjectId(athleteId),
  })
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
    })
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

  if (!CANCELLABLE_STATUSES.has(reservation.status)) {
    throw new AppError('Only pending or confirmed reservations can be cancelled', 400);
  }

  if (!canCancelReservation(reservation)) {
    throw new AppError('Reservation can be cancelled only at least 12 hours before start time', 400);
  }

  reservation.status = ReservationStatus.Cancelled;
  await reservation.save();

  const updatedReservation = (await Reservation.findById(reservationId)
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
    })
    .lean()) as unknown as PopulatedReservation | null;

  if (!updatedReservation) {
    throw new AppError('Reservation not found', 404);
  }

  return {
    reservation: toAthleteReservation(updatedReservation),
  };
};

export { cancelReservation, getProfile, getReservations, updateProfile };
