import { Types } from 'mongoose';

import { Appointment, AppointmentStatus } from '../../models/Appointment';
import { FacilityStatus, type IOpeningHour } from '../../models/Facility';
import { Reservation, ReservationStatus } from '../../models/Reservation';
import { Resource, type IResource } from '../../models/Resource';
import { Sport, type ISport } from '../../models/Sport';
import { Trainer, type ITrainer } from '../../models/Trainer';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  PublicTrainerDetails,
  PublicTrainerListItem,
  TrainerAvailability,
  TrainerAvailabilityQuery,
  TrainerListQuery,
} from './trainer.types';

type PopulatedSport = ISport & {
  _id: Types.ObjectId;
};

type TrainerFacility = {
  _id: Types.ObjectId;
  name: string;
  city: string;
  status: FacilityStatus;
  active: boolean;
  openingHours?: IOpeningHour[];
};

type PopulatedTrainer = Omit<ITrainer, 'sports' | 'facilityId'> & {
  _id: Types.ObjectId;
  sports: PopulatedSport[];
  facilityId: TrainerFacility;
};

type TrainerResource = IResource & {
  _id: Types.ObjectId;
  sportId: PopulatedSport;
};

const approvedActiveFacilityFilter = {
  status: FacilityStatus.Approved,
  active: true,
} as const;

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

const getOpeningHoursForDate = (openingHours: IOpeningHour[] | undefined, date: Date) => {
  const weekday = date.getUTCDay();
  const openingHour = (openingHours ?? []).find((item) => item.day === weekday);

  if (!openingHour) {
    throw new AppError('Trainer is not available on the selected date', 400);
  }

  return openingHour;
};

const toTrainerListItem = (trainer: PopulatedTrainer): PublicTrainerListItem => {
  return {
    id: trainer._id.toString(),
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    facility: {
      id: trainer.facilityId._id.toString(),
      name: trainer.facilityId.name,
      city: trainer.facilityId.city,
    },
    sports: (trainer.sports ?? []).map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    specialization: trainer.biography,
    hourlyPrice: trainer.pricePerHour,
    ratingAverage: 0,
    ratingCount: 0,
    active: trainer.active,
  };
};

const toTrainerDetails = (trainer: PopulatedTrainer): PublicTrainerDetails => {
  return {
    ...toTrainerListItem(trainer),
    phone: trainer.phone,
    email: trainer.email,
    biography: trainer.biography,
    workingHours: trainer.workingHours ?? [],
    resources: [],
    createdAt: trainer.createdAt ?? new Date(),
  };
};

const getActiveTrainer = async (trainerId: string) => {
  if (!Types.ObjectId.isValid(trainerId)) {
    throw new AppError('Invalid trainer id', 400);
  }

  const trainer = (await Trainer.findOne({
    _id: new Types.ObjectId(trainerId),
    active: true,
  })
    .populate({
      path: 'facilityId',
      select: 'name city status active openingHours',
      match: approvedActiveFacilityFilter,
    })
    .populate({
      path: 'sports',
      select: 'name',
      match: { active: true },
    })
    .lean()) as unknown as PopulatedTrainer | null;

  if (!trainer || !trainer.facilityId) {
    throw new AppError('Trainer not found', 404);
  }

  return trainer;
};

const getTrainers = async (query: TrainerListQuery) => {
  const filter: Record<string, unknown> = {
    active: true,
  };

  if (query.facilityId?.trim()) {
    const facilityId = query.facilityId.trim();

    if (!Types.ObjectId.isValid(facilityId)) {
      throw new AppError('Invalid facilityId', 400);
    }

    filter.facilityId = new Types.ObjectId(facilityId);
  }

  if (query.sportId?.trim()) {
    const sportId = query.sportId.trim();

    if (!Types.ObjectId.isValid(sportId)) {
      throw new AppError('Invalid sportId', 400);
    }

    const sport = await Sport.findOne({
      _id: new Types.ObjectId(sportId),
      active: true,
    }).select('_id');

    if (!sport) {
      throw new AppError('Sport not found', 404);
    }

    filter.sports = new Types.ObjectId(sportId);
  }

  const trainers = (await Trainer.find(filter)
    .populate({
      path: 'facilityId',
      select: 'name city status active',
      match: approvedActiveFacilityFilter,
    })
    .populate({
      path: 'sports',
      select: 'name',
      match: { active: true },
    })
    .sort({ lastName: 1, firstName: 1 })
    .lean()) as unknown as PopulatedTrainer[];

  return {
    trainers: trainers
      .filter((trainer) => !!trainer.facilityId)
      .map((trainer) => toTrainerListItem(trainer)),
  };
};

const getTrainer = async (trainerId: string) => {
  const trainer = await getActiveTrainer(trainerId);
  const resources = (await Resource.find({
    facilityId: trainer.facilityId._id,
    active: true,
    sportId: {
      $in: (trainer.sports ?? []).map((sport) => sport._id),
    },
  })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .sort({ name: 1 })
    .lean()) as unknown as TrainerResource[];

  return {
    trainer: {
      ...toTrainerDetails(trainer),
      resources: resources.map((resource) => ({
        id: resource._id.toString(),
        name: resource.name,
        type: resource.type,
        sport: {
          id: resource.sportId._id.toString(),
          name: resource.sportId.name,
        },
      })),
    },
  };
};

const getTrainerAvailability = async (
  athleteId: string,
  trainerId: string,
  query: TrainerAvailabilityQuery,
): Promise<{ availability: TrainerAvailability }> => {
  const date = String(query.date ?? '');
  const resourceId = String(query.resourceId ?? '').trim();
  const parsedDate = parseDateOnly(date);
  const trainer = await getActiveTrainer(trainerId);
  const blockedAthlete = await User.exists({
    _id: athleteId,
    blockedFacilities: trainer.facilityId._id,
  });

  if (blockedAthlete) {
    throw new AppError('You are blocked in this facility and cannot book this trainer.', 403);
  }

  if (!Types.ObjectId.isValid(resourceId)) {
    throw new AppError('Invalid resourceId', 400);
  }
  const resource = (await Resource.findOne({
    _id: new Types.ObjectId(resourceId),
    facilityId: trainer.facilityId._id,
    active: true,
    sportId: {
      $in: (trainer.sports ?? []).map((sport) => sport._id),
    },
  })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as TrainerResource | null;

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  const sourceOpeningHours =
    trainer.workingHours && trainer.workingHours.length > 0
      ? trainer.workingHours
      : trainer.facilityId.openingHours;
  const openingHours = getOpeningHoursForDate(sourceOpeningHours, parsedDate);

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const [appointmentsForTrainer, appointmentsForResource, reservationsForResource] = await Promise.all([
    Appointment.find({
      trainerId: trainer._id,
      status: { $ne: AppointmentStatus.Cancelled },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart },
    })
      .sort({ startTime: 1 })
      .select('startTime endTime')
      .lean(),
    Appointment.find({
      resourceId: resource._id,
      status: { $ne: AppointmentStatus.Cancelled },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart },
    })
      .sort({ startTime: 1 })
      .select('startTime endTime')
      .lean(),
    Reservation.find({
      resourceId: resource._id,
      status: { $ne: ReservationStatus.Cancelled },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart },
    })
      .sort({ startTime: 1 })
      .select('startTime endTime')
      .lean(),
  ]);

  const occupiedIntervals = [
    ...appointmentsForTrainer,
    ...appointmentsForResource,
    ...reservationsForResource,
  ]
    .sort((first, second) => first.startTime.getTime() - second.startTime.getTime())
    .map((interval) => ({
      startTime: interval.startTime,
      endTime: interval.endTime,
    }));

  return {
    availability: {
      trainer: {
        id: trainer._id.toString(),
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        facilityId: trainer.facilityId._id.toString(),
        facilityName: trainer.facilityId.name,
      },
      resource: {
        id: resource._id.toString(),
        name: resource.name,
        type: resource.type,
        sportId: resource.sportId._id.toString(),
        sportName: resource.sportId.name,
      },
      date,
      openingTime: openingHours.open,
      closingTime: openingHours.close,
      occupiedIntervals,
    },
  };
};

export {
  getTrainer,
  getTrainerAvailability,
  getTrainers,
};
