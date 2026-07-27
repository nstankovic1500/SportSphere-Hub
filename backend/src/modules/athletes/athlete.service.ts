import { Types } from 'mongoose';

import { Appointment, AppointmentStatus, type IAppointment } from '../../models/Appointment';
import { Cart, type ICart } from '../../models/Cart';
import { Facility, FacilityStatus, type IOpeningHour } from '../../models/Facility';
import { Order, OrderStatus, type IOrder } from '../../models/Order';
import { Product, type IProduct } from '../../models/Product';
import { Reservation, ReservationStatus, type IReservation } from '../../models/Reservation';
import { Resource, type IResource } from '../../models/Resource';
import { Sport, type ISport } from '../../models/Sport';
import { Trainer, type ITrainer } from '../../models/Trainer';
import { User, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  AthleteCartItem,
  AthleteCartResponse,
  AthleteOrder,
  AthleteProfile,
  AthleteReservation,
  CartItemBody,
  CreateTrainingAppointmentBody,
  CreateReservationBody,
  ResourceAvailability,
  TrainingAppointment,
  UpdateAthleteOrderStatusBody,
  UpdateCartItemBody,
  UpdateAthleteProfileBody,
} from './athlete.types';

const CAN_BE_CANCELLED = new Set<ReservationStatus>([
  ReservationStatus.Pending,
  ReservationStatus.Confirmed,
]);

const CAN_CANCEL_APPOINTMENT = new Set<AppointmentStatus>([
  AppointmentStatus.Scheduled,
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

type TrainerWithRefs = Omit<ITrainer, 'sports' | 'facilityId'> & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    city: string;
    status: FacilityStatus;
    active: boolean;
    openingHours?: IOpeningHour[];
  };
  sports: PopulatedSport[];
};

type PopulatedAppointment = IAppointment & {
  _id: Types.ObjectId;
  trainerId: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
  };
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

type ProductWithFacility = IProduct & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    city: string;
    status: FacilityStatus;
    active: boolean;
  };
};

type CartDocument = ICart & {
  _id: Types.ObjectId;
  items: Array<{
    _id?: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
  }>;
  save: () => Promise<unknown>;
};

type PopulatedOrder = IOrder & {
  _id: Types.ObjectId;
  facilityId: {
    _id: Types.ObjectId;
    name: string;
    city: string;
  };
};

const hydrateLegacyOrderItems = async (
  order: {
    items: Array<{
      productId: Types.ObjectId;
      name?: string;
      priceAtPurchase?: number;
      quantity: number;
    }>;
    markModified?: (path: string) => void;
  },
) => {
  const missingProductIds = [
    ...new Set(
      (order.items ?? [])
        .filter(
          (item) =>
            !item.name ||
            !item.name.trim() ||
            typeof item.priceAtPurchase !== 'number' ||
            Number.isNaN(item.priceAtPurchase),
        )
        .map((item) => item.productId?.toString?.() ?? '')
        .filter(Boolean),
    ),
  ];

  if (missingProductIds.length === 0) {
    return;
  }

  const products = await Product.find({
    _id: { $in: missingProductIds.map((productId) => new Types.ObjectId(productId)) },
  })
    .select('name price')
    .lean();
  const productMap = new Map(products.map((product) => [product._id!.toString(), product]));

  for (const item of order.items ?? []) {
    const product = productMap.get(item.productId?.toString?.() ?? '');

    if (!product) {
      continue;
    }

    if (!item.name || !item.name.trim()) {
      item.name = product.name;
    }

    if (typeof item.priceAtPurchase !== 'number' || Number.isNaN(item.priceAtPurchase)) {
      item.priceAtPurchase = product.price;
    }
  }

  order.markModified?.('items');
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

const populateAppointmentRefs = (query: any) => {
  return query
    .populate({
      path: 'trainerId',
      select: 'firstName lastName',
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

const canCancelTrainingAppointment = (
  appointment: Pick<IAppointment, 'status' | 'startTime'>,
) => {
  return (
    CAN_CANCEL_APPOINTMENT.has(appointment.status) &&
    appointment.startTime.getTime() > new Date().getTime()
  );
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

const getTrainerWithFacility = async (trainerId: string) => {
  if (!Types.ObjectId.isValid(trainerId)) {
    throw new AppError('Invalid trainer id', 400);
  }

  const trainer = (await Trainer.findById(trainerId)
    .populate({
      path: 'facilityId',
      select: 'name city status active openingHours',
    })
    .populate({
      path: 'sports',
      select: 'name active',
      match: { active: true },
    })
    .lean()) as unknown as TrainerWithRefs | null;

  if (!trainer || !(trainer.active === true)) {
    throw new AppError('Trainer not found', 404);
  }

  if (
    !trainer.facilityId ||
    !(trainer.facilityId.status === FacilityStatus.Approved) ||
    !(trainer.facilityId.active === true)
  ) {
    throw new AppError('Trainer facility is not available for appointments', 400);
  }

  return trainer;
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

const toTrainingAppointment = (
  appointment: PopulatedAppointment,
): TrainingAppointment => {
  return {
    id: appointment._id.toString(),
    trainerName: `${appointment.trainerId.firstName} ${appointment.trainerId.lastName}`.trim(),
    facilityName: appointment.facilityId.name,
    city: appointment.facilityId.city,
    resourceName: appointment.resourceId.name,
    sportName: appointment.sportId.name,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    canCancel: canCancelTrainingAppointment(appointment),
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

const getCartDocument = async (athleteId: string) => {
  let cart = await Cart.findOne({ athleteId });

  if (!cart) {
    cart = await Cart.create({
      athleteId,
      items: [],
    });
  }

  return cart as CartDocument;
};

const getActiveProductWithFacility = async (productId: string) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product id', 400);
  }

  const product = (await Product.findById(productId)
    .populate({
      path: 'facilityId',
      select: 'name city status active',
    })
    .lean()) as unknown as ProductWithFacility | null;

  if (!product || !product.active) {
    throw new AppError('Product not found', 404);
  }

  if (
    !product.facilityId ||
    product.facilityId.status !== FacilityStatus.Approved ||
    product.facilityId.active !== true
  ) {
    throw new AppError('Product is not available', 400);
  }

  return product;
};

const validateCartQuantity = (value: unknown) => {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError('quantity must be a positive integer', 400);
  }

  return quantity;
};

const mapCartItems = async (cart: CartDocument): Promise<AthleteCartResponse> => {
  if (cart.items.length === 0) {
    return {
      items: [],
      totalPrice: 0,
    };
  }

  const products = (await Product.find({
    _id: {
      $in: cart.items.map((item) => item.productId),
    },
    active: true,
  })
    .populate({
      path: 'facilityId',
      select: 'name city status active',
    })
    .lean()) as unknown as ProductWithFacility[];

  const productMap = new Map(
    products
      .filter(
        (product) =>
          !!product.facilityId &&
          product.facilityId.status === FacilityStatus.Approved &&
          product.facilityId.active === true,
      )
      .map((product) => [product._id.toString(), product]),
  );

  const items: AthleteCartItem[] = cart.items
    .map((item) => {
      const product = productMap.get(item.productId.toString());

      if (!product) {
        return null;
      }

      return {
        id: item._id?.toString() ?? '',
        productId: product._id.toString(),
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        category: product.category,
        image: product.image ?? null,
        facility: {
          id: product.facilityId._id.toString(),
          name: product.facilityId.name,
          city: product.facilityId.city,
        },
        lineTotal: product.price * item.quantity,
      };
    })
    .filter((item): item is AthleteCartItem => item !== null);

  return {
    items,
    totalPrice: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};

const toAthleteOrder = (order: PopulatedOrder): AthleteOrder => ({
  id: order._id.toString(),
  facility: {
    id: order.facilityId._id.toString(),
    name: order.facilityId.name,
    city: order.facilityId.city,
  },
  items: order.items.map((item) => ({
    productId: item.productId.toString(),
    name: item.name,
    quantity: item.quantity,
    priceAtPurchase: item.priceAtPurchase,
  })),
  totalPrice: order.totalPrice,
  status: order.status,
  createdAt: order.createdAt ?? new Date(),
});

const ensureAthleteNotBlockedInFacility = async (
  athleteId: Types.ObjectId | string,
  facilityId: Types.ObjectId,
) => {
  const blockedAthlete = await User.exists({
    _id: athleteId,
    blockedFacilities: facilityId,
  });

  if (blockedAthlete) {
    throw new AppError('You are blocked in this facility', 403);
  }
};

const getPopulatedReservation = async (
  reservationId: Types.ObjectId | string,
) => {
  return populateReservationRefs(Reservation.findById(reservationId)).lean();
};

const getPopulatedAppointment = async (
  appointmentId: Types.ObjectId | string,
) => {
  return populateAppointmentRefs(Appointment.findById(appointmentId)).lean();
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

  if (!(sports.length === objectIds.length)) {
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

const getTrainingAppointments = async (
  athleteId: string,
) => {
  const appointments = (await populateAppointmentRefs(
    Appointment.find({
      athleteId: new Types.ObjectId(athleteId),
    }),
  )
    .sort({ startTime: -1 })
    .lean()) as unknown as PopulatedAppointment[];

  return {
    appointments: appointments.map((appointment) =>
      toTrainingAppointment(appointment),
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

  if (!(reservation.athleteId.toString() === athleteId)) {
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

const cancelTrainingAppointment = async (
  athleteId: string,
  appointmentId: string,
) => {
  if (!Types.ObjectId.isValid(appointmentId)) {
    throw new AppError('Invalid appointment id', 400);
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Training appointment not found', 404);
  }

  if (!(appointment.athleteId.toString() === athleteId)) {
    throw new AppError('You do not have permission to access this training appointment', 403);
  }

  if (!CAN_CANCEL_APPOINTMENT.has(appointment.status)) {
    throw new AppError('Only scheduled training appointments can be cancelled', 400);
  }

  if (!(appointment.startTime.getTime() > new Date().getTime())) {
    throw new AppError('Only future training appointments can be cancelled', 400);
  }

  appointment.status = AppointmentStatus.Cancelled;
  await appointment.save();

  const updatedAppointment = (await getPopulatedAppointment(
    appointmentId,
  )) as unknown as PopulatedAppointment | null;

  if (!updatedAppointment) {
    throw new AppError('Training appointment not found', 404);
  }

  return {
    appointment: toTrainingAppointment(updatedAppointment),
  };
};

const getResourceAvailability = async (
  resourceId: string,
  date: string,
): Promise<{ availability: ResourceAvailability }> => {
  const parsedDate = parseDateOnly(date);
  const resource = await getActiveResourceWithFacility(resourceId);
  const openingHours = (resource.facilityId.openingHours ?? []).find(
    (item) => item.day === parsedDate.getUTCDay(),
  );

  const resourceSummary = {
    id: resource._id.toString(),
    name: resource.name,
    facilityId: resource.facilityId._id.toString(),
    facilityName: resource.facilityId.name,
    sportId: resource.sportId._id.toString(),
    sportName: resource.sportId.name,
  };

  if (!openingHours) {
    return {
      availability: {
        resource: resourceSummary,
        date,
        openingTime: '',
        closingTime: '',
        closed: true,
        occupiedIntervals: [],
      },
    };
  }

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

  const appointments = await Appointment.find({
    resourceId: resource._id,
    status: { $ne: AppointmentStatus.Cancelled },
    startTime: { $lt: dayEnd },
    endTime: { $gt: dayStart },
  })
    .sort({ startTime: 1 })
    .select('startTime endTime')
    .lean();

  return {
    availability: {
      resource: resourceSummary,
      date,
      openingTime: openingHours.open,
      closingTime: openingHours.close,
      closed: false,
      occupiedIntervals: [...reservations, ...appointments]
        .sort((first, second) => first.startTime.getTime() - second.startTime.getTime())
        .map((interval) => ({
          startTime: interval.startTime,
          endTime: interval.endTime,
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
  await ensureAthleteNotBlockedInFacility(athlete._id, resource.facilityId._id);

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

  if (!(getDateKey(startTime) === getDateKey(endTime))) {
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

  const overlappingAppointment = await Appointment.findOne({
    resourceId: resource._id,
    status: { $ne: AppointmentStatus.Cancelled },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).select('_id');

  if (overlappingAppointment) {
    throw new AppError('Reservation overlaps with an existing training appointment on this resource', 400);
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

const createTrainingAppointment = async (
  athleteId: string,
  body: CreateTrainingAppointmentBody,
) => {
  const trainerId = String(body.trainerId ?? '').trim();
  const resourceId = String(body.resourceId ?? '').trim();
  const startTime = parseDateTime(body.startTime, 'startTime');
  const endTime = parseDateTime(body.endTime, 'endTime');

  const athlete = await User.findById(athleteId);

  if (!athlete) {
    throw new AppError('Athlete not found', 404);
  }

  const trainer = await getTrainerWithFacility(trainerId);
  const resource = await getActiveResourceWithFacility(resourceId);
  await ensureAthleteNotBlockedInFacility(athlete._id, trainer.facilityId._id);

  if (resource.facilityId._id.toString() !== trainer.facilityId._id.toString()) {
    throw new AppError('resource must belong to the trainer facility', 400);
  }

  if (startTime.getTime() <= new Date().getTime()) {
    throw new AppError('Rezervacija ne može biti u prošlosti', 400);
  }

  if (!isOnFullHour(startTime) || !isOnFullHour(endTime)) {
    throw new AppError('startTime and endTime must be on full hours', 400);
  }

  if (endTime.getTime() <= startTime.getTime()) {
    throw new AppError('endTime must be after startTime', 400);
  }

  if (!(getDateKey(startTime) === getDateKey(endTime))) {
    throw new AppError('Trening mora započeti i završiti se istog dana', 400);
  }

  if (endTime.getTime() - startTime.getTime() < 60 * 60 * 1000) {
    throw new AppError('Minimum training appointment duration is 1 hour', 400);
  }

  const availableSports = trainer.sports ?? [];

  if (availableSports.length === 0) {
    throw new AppError('Trener nema aktivne sportove', 400);
  }

  let selectedSport = availableSports[0];

  if (availableSports.length > 1) {
    const sportId = String(body.sportId ?? '').trim();

    if (!sportId) {
      throw new AppError('sportId is required when trainer supports multiple sports', 400);
    }

    selectedSport =
      availableSports.find((sport) => sport._id.toString() === sportId) ?? availableSports[0];

    if (!(selectedSport._id.toString() === sportId)) {
      throw new AppError('sportId must be one of the trainer supported sports', 400);
    }
  } else if (body.sportId) {
    const sportId = String(body.sportId).trim();

    if (!(availableSports[0]._id.toString() === sportId)) {
      throw new AppError('sportId must be one of the trainer supported sports', 400);
    }
  }

  if (resource.sportId._id.toString() !== selectedSport._id.toString()) {
    throw new AppError('resource must support the selected sport', 400);
  }

  const openingHours = getOpeningHoursForDate(
    trainer.workingHours && trainer.workingHours.length > 0
      ? trainer.workingHours
      : trainer.facilityId.openingHours,
    startTime,
  );
  const openingDateTime = toDateTimeFromDayAndTime(startTime, openingHours.open);
  const closingDateTime = toDateTimeFromDayAndTime(startTime, openingHours.close);

  if (
    startTime.getTime() < openingDateTime.getTime() ||
    endTime.getTime() > closingDateTime.getTime()
  ) {
    throw new AppError('Training appointment must fit inside trainer working hours', 400);
  }

  const overlappingReservation = await Reservation.findOne({
    resourceId: resource._id,
    status: { $ne: ReservationStatus.Cancelled },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).select('_id');

  if (overlappingReservation) {
    throw new AppError('Preklapanje termina', 400);
  }

  const overlappingAppointmentOnResource = await Appointment.findOne({
    resourceId: resource._id,
    status: { $ne: AppointmentStatus.Cancelled },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).select('_id');

  if (overlappingAppointmentOnResource) {
    throw new AppError('Preklapanje termina', 400);
  }

  const overlappingAppointment = await Appointment.findOne({
    trainerId: trainer._id,
    status: { $ne: AppointmentStatus.Cancelled },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).select('_id');

  if (overlappingAppointment) {
    throw new AppError('Preklapanje termina', 400);
  }

  const createdAppointment = await Appointment.create({
    trainerId: trainer._id,
    athleteId: athlete._id,
    facilityId: trainer.facilityId._id,
    resourceId: resource._id,
    sportId: selectedSport._id,
    startTime,
    endTime,
    status: AppointmentStatus.Scheduled,
    createdAt: new Date(),
  });

  const appointment = (await getPopulatedAppointment(
    createdAppointment._id,
  )) as unknown as PopulatedAppointment | null;

  if (!appointment) {
    throw new AppError('Training appointment not found', 404);
  }

  return {
    appointment: toTrainingAppointment(appointment),
  };
};

const getCart = async (athleteId: string) => {
  const cart = await getCartDocument(athleteId);
  return mapCartItems(cart);
};

const addCartItem = async (athleteId: string, body: CartItemBody) => {
  const productId = String(body.productId ?? '').trim();
  const quantity = validateCartQuantity(body.quantity);
  const product = await getActiveProductWithFacility(productId);
  const cart = await getCartDocument(athleteId);
  const existingItem = cart.items.find(
    (item) => item.productId.toString() === product._id.toString(),
  );
  const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (nextQuantity > product.stock) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      quantity,
    });
  }

  await cart.save();

  return getCart(athleteId);
};

const updateCartItem = async (
  athleteId: string,
  itemId: string,
  body: UpdateCartItemBody,
) => {
  if (!Types.ObjectId.isValid(itemId)) {
    throw new AppError('Invalid cart item id', 400);
  }

  const quantity = validateCartQuantity(body.quantity);
  const cart = await getCartDocument(athleteId);
  const item = cart.items.find((currentItem) => currentItem._id?.toString() === itemId);

  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  const product = await getActiveProductWithFacility(item.productId.toString());

  if (quantity > product.stock) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  item.quantity = quantity;
  await cart.save();

  return getCart(athleteId);
};

const deleteCartItem = async (athleteId: string, itemId: string) => {
  if (!Types.ObjectId.isValid(itemId)) {
    throw new AppError('Invalid cart item id', 400);
  }

  const cart = await getCartDocument(athleteId);
  const nextItems = cart.items.filter((item) => item._id?.toString() !== itemId);

  if (nextItems.length === cart.items.length) {
    throw new AppError('Cart item not found', 404);
  }

  cart.items = nextItems;
  await cart.save();

  return getCart(athleteId);
};

const checkoutOrders = async (athleteId: string) => {
  const athlete = await getAthlete(athleteId);
  const cart = await getCartDocument(athleteId);

  if (cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const cartSummary = await mapCartItems(cart);

  if (cartSummary.items.length === 0) {
    throw new AppError('Cart does not contain available products', 400);
  }

  const productIds = cartSummary.items.map((item) => new Types.ObjectId(item.productId));
  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
  });
  const productMap = new Map(products.map((product) => [product._id!.toString(), product]));
  const groupedByFacility = new Map<
    string,
    { facilityId: Types.ObjectId; items: AthleteCartItem[] }
  >();

  for (const item of cartSummary.items) {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError(`Product ${item.name} is no longer available`, 400);
    }

    if (item.quantity > product.stock) {
      throw new AppError(`Insufficient stock for ${item.name}`, 400);
    }

    const existingGroup = groupedByFacility.get(item.facility.id);

    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groupedByFacility.set(item.facility.id, {
        facilityId: product.facilityId,
        items: [item],
      });
    }
  }

  const createdOrderIds: Types.ObjectId[] = [];

  for (const group of groupedByFacility.values()) {
    const orderItems = group.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new AppError(`Product ${item.name || item.productId} is no longer available`, 400);
      }

      const snapshotName =
        typeof product.name === 'string' && product.name.trim()
          ? product.name.trim()
          : typeof item.name === 'string' && item.name.trim()
            ? item.name.trim()
            : '';
      const snapshotPrice =
        typeof product.price === 'number' && Number.isFinite(product.price)
          ? product.price
          : typeof item.price === 'number' && Number.isFinite(item.price)
            ? item.price
            : NaN;

      if (!snapshotName) {
        throw new AppError('Naziv proizvoda nedostaje za kreiranje porudžbine', 400);
      }

      if (Number.isNaN(snapshotPrice)) {
        throw new AppError('Cena proizvoda nedostaje za kreiranje porudžbine', 400);
      }

      return {
        productId: new Types.ObjectId(item.productId),
        name: snapshotName,
        quantity: item.quantity,
        priceAtPurchase: snapshotPrice,
      };
    });

    const order = await Order.create({
      athleteId: athlete._id,
      facilityId: group.facilityId,
      items: orderItems,
      totalPrice: group.items.reduce((sum, item) => sum + item.lineTotal, 0),
      status: OrderStatus.Pending,
      createdAt: new Date(),
    });

    createdOrderIds.push(order._id as Types.ObjectId);

    for (const item of group.items) {
      const product = productMap.get(item.productId);

      if (product) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          {
            new: true,
          },
        ).select('_id');

        if (!updatedProduct) {
          throw new AppError(`Insufficient stock for ${item.name}`, 400);
        }
      }
    }
  }

  cart.items = [];
  await cart.save();

  const orders = (await Order.find({
    _id: { $in: createdOrderIds },
  })
    .populate({
      path: 'facilityId',
      select: 'name city',
    })
    .sort({ createdAt: -1 })
    .lean()) as unknown as PopulatedOrder[];

  return {
    orders: orders.map((order) => toAthleteOrder(order)),
  };
};

const getOrders = async (athleteId: string) => {
  const orders = (await Order.find({
    athleteId: new Types.ObjectId(athleteId),
  })
    .populate({
      path: 'facilityId',
      select: 'name city',
    })
    .sort({ createdAt: -1 })
    .lean()) as unknown as PopulatedOrder[];

  return {
    orders: orders.map((order) => toAthleteOrder(order)),
  };
};

const updateOrderStatus = async (
  athleteId: string,
  orderId: string,
  body: UpdateAthleteOrderStatusBody,
) => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400);
  }

  const status = String(body.status ?? '').trim() as OrderStatus;

  if (status !== OrderStatus.Cancelled) {
    throw new AppError('Athlete can only set order status to cancelled', 400);
  }

  const order = await Order.findOne({
    _id: new Types.ObjectId(orderId),
    athleteId: new Types.ObjectId(athleteId),
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status === OrderStatus.Completed || order.status === OrderStatus.Cancelled) {
    throw new AppError('Only active orders can be cancelled', 400);
  }

  await hydrateLegacyOrderItems(order);
  order.status = OrderStatus.Cancelled;
  await order.save();

  const updatedOrder = (await Order.findById(order._id)
    .populate({
      path: 'facilityId',
      select: 'name city',
    })
    .lean()) as unknown as PopulatedOrder | null;

  if (!updatedOrder) {
    throw new AppError('Order not found', 404);
  }

  return {
    order: toAthleteOrder(updatedOrder),
  };
};

export {
  addCartItem,
  cancelTrainingAppointment,
  cancelReservation,
  checkoutOrders,
  createTrainingAppointment,
  createReservation,
  deleteCartItem,
  getCart,
  getOrders,
  getProfile,
  getReservations,
  getResourceAvailability,
  getTrainingAppointments,
  updateOrderStatus,
  updateCartItem,
  updateProfile,
};
