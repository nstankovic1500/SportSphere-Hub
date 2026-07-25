import { Types } from 'mongoose';

import { Facility, FacilityStatus, type IFacility, type IOpeningHour } from '../../models/Facility';
import { Appointment, AppointmentStatus, type IAppointment } from '../../models/Appointment';
import { Reservation, ReservationStatus, type IReservation } from '../../models/Reservation';
import { Resource, ResourceType, type IResource } from '../../models/Resource';
import { Sport, type ISport } from '../../models/Sport';
import { Trainer, type ITrainer } from '../../models/Trainer';
import { User, UserRole, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  AttendanceItem,
  AttendanceQuery,
  AttendanceUpdateResult,
} from './attendance.types';
import type {
  CreateEmployeeFacilityBody,
  CreateEmployeeResourceBody,
  CreateEmployeeTrainerBody,
  EmployeeFacility,
  EmployeeProfile,
  EmployeeResource,
  EmployeeTrainer,
  UpdateEmployeeFacilityBody,
  UpdateEmployeeProfileBody,
  UpdateEmployeeResourceBody,
  UpdateEmployeeTrainerBody,
} from './employee.types';

type PopulatedSport = ISport & { _id: Types.ObjectId };

type EmployeeUser = IUser & {
  _id: Types.ObjectId;
  favoriteSports?: PopulatedSport[];
};

type FacilityWithSports = IFacility & {
  _id: Types.ObjectId;
  sports: PopulatedSport[];
};

type PopulatedResource = IResource & {
  _id: Types.ObjectId;
  sportId: PopulatedSport;
};

type PopulatedTrainer = ITrainer & {
  _id: Types.ObjectId;
  sports: PopulatedSport[];
};

type AttendanceAthlete = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
};

type AttendanceReservation = IReservation & {
  _id: Types.ObjectId;
  athleteId: AttendanceAthlete;
  resourceId: {
    _id: Types.ObjectId;
    name: string;
  } | null;
  sportId: PopulatedSport | null;
};

type AttendanceAppointment = IAppointment & {
  _id: Types.ObjectId;
  athleteId: AttendanceAthlete;
  trainerId: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
  } | null;
  sportId: PopulatedSport | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ATTENDANCE_PERIOD = 10 * 60 * 1000;

const validateObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const toEmployeeProfile = (user: EmployeeUser): EmployeeProfile => {
  const favoriteSports = (user.favoriteSports ?? []) as PopulatedSport[];

  if (!user.employeeData) {
    throw new AppError('employee data is required for employees', 400);
  }

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
    employeeData: {
      companyName: user.employeeData.companyName ?? '',
      headOfficeAddress: user.employeeData.headOfficeAddress ?? '',
      registrationNumber: user.employeeData.registrationNumber ?? '',
      pib: user.employeeData.pib ?? '',
    },
    role: user.role,
    status: user.status,
    createdAt: user.createdAt ?? new Date(),
  };
};

const toEmployeeFacility = (facility: FacilityWithSports): EmployeeFacility => {
  const sports = (facility.sports ?? []) as PopulatedSport[];

  return {
    id: facility._id.toString(),
    name: facility.name,
    city: facility.city,
    country: facility.country,
    address: facility.address,
    description: facility.description,
    location: facility.location,
    openingHours: facility.openingHours ?? [],
    status: facility.status,
    active: facility.active,
    hourlyPrice: facility.hourlyPrice,
    allowedNoShows: facility.allowedNoShows,
    images: facility.images ?? [],
    sports: sports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    createdAt: facility.createdAt ?? new Date(),
  };
};

const toEmployeeResource = (resource: PopulatedResource): EmployeeResource => {
  return {
    id: resource._id.toString(),
    name: resource.name,
    type: resource.type,
    sport: {
      id: resource.sportId._id.toString(),
      name: resource.sportId.name,
    },
    capacity: resource.capacity,
    equipmentDescription: resource.equipmentDescription,
    active: resource.active,
  };
};

const toEmployeeTrainer = (trainer: PopulatedTrainer): EmployeeTrainer => {
  const sports = (trainer.sports ?? []) as PopulatedSport[];

  return {
    id: trainer._id.toString(),
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
    phone: trainer.phone,
    sports: sports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    workingHours: trainer.workingHours ?? [],
    biography: trainer.biography,
    pricePerHour: trainer.pricePerHour,
    active: trainer.active,
    createdAt: trainer.createdAt ?? new Date(),
  };
};

const getEmployee = async (employeeId: string) => {
  const user = (await User.findById(employeeId)
    .populate({
      path: 'favoriteSports',
      select: 'name',
    })
    .lean()) as unknown as EmployeeUser | null;

  if (!user || !(user.role === UserRole.Employee)) {
    throw new AppError('Employee not found', 404);
  }

  return user;
};

const getEmployeeAsUser = async (employeeId: string) => {
  const user = await User.findById(employeeId).select('_id role');

  if (!user || !(user.role === UserRole.Employee)) {
    throw new AppError('Employee not found', 404);
  }

  return user;
};

const getFacilityByEmployee = async (employeeId: string, facilityId: string) => {
  validateObjectId(facilityId, 'facility id');

  const facility = await Facility.findOne({
    _id: new Types.ObjectId(facilityId),
    employeeIds: new Types.ObjectId(employeeId),
  });

  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  return facility;
};

const getFacilityByEmployeeWithSports = async (employeeId: string, facilityId: string) => {
  validateObjectId(facilityId, 'facility id');

  const facility = (await Facility.findOne({
    _id: new Types.ObjectId(facilityId),
    employeeIds: new Types.ObjectId(employeeId),
  })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean()) as unknown as FacilityWithSports | null;

  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  return facility;
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

const attencanceRecordEnabled = (
  startTime: Date,
  status: ReservationStatus | AppointmentStatus,
) => {
  const now = new Date().getTime();
  const start = startTime.getTime();
  const allowedStatuses = new Set([
    ReservationStatus.Pending,
    ReservationStatus.Confirmed,
    AppointmentStatus.Scheduled,
  ]);

  return allowedStatuses.has(status) && now >= start && now <= start + ATTENDANCE_PERIOD;
};

const toAthleteName = (athlete: AttendanceAthlete) =>
  `${athlete.firstName} ${athlete.lastName}`.trim();

const toAttendanceReservationItem = (reservation: AttendanceReservation): AttendanceItem => ({
  id: reservation._id.toString(),
  type: 'reservation',
  athleteId: reservation.athleteId._id.toString(),
  athleteName: toAthleteName(reservation.athleteId),
  resourceName: reservation.resourceId?.name ?? null,
  trainerName: null,
  sportName: reservation.sportId?.name ?? '',
  startTime: reservation.startTime,
  endTime: reservation.endTime,
  status: reservation.status,
  attencanceRecordEnabled: attencanceRecordEnabled(reservation.startTime, reservation.status),
});

const toAttendanceAppointmentItem = (appointment: AttendanceAppointment): AttendanceItem => ({
  id: appointment._id.toString(),
  type: 'training',
  athleteId: appointment.athleteId._id.toString(),
  athleteName: toAthleteName(appointment.athleteId),
  resourceName: null,
  trainerName: appointment.trainerId
    ? `${appointment.trainerId.firstName} ${appointment.trainerId.lastName}`.trim()
    : null,
  sportName: appointment.sportId?.name ?? '',
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  status: appointment.status,
  attencanceRecordEnabled: attencanceRecordEnabled(appointment.startTime, appointment.status),
});

const ensureAttendanceWindow = (startTime: Date) => {
  const now = new Date().getTime();
  const start = startTime.getTime();

  if (now < start || now > start + ATTENDANCE_PERIOD) {
    throw new AppError('Attendance can only be recorded from startTime until 10 minutes after startTime', 400);
  }
};

const evaluateNoShowBlocking = async (
  athleteId: Types.ObjectId,
  facility: IFacility & { _id: Types.ObjectId },
) => {
  const [reservationNoShows, appointmentNoShows, athlete] = await Promise.all([
    Reservation.countDocuments({
      athleteId,
      facilityId: facility._id,
      status: ReservationStatus.NoShow,
    }),
    Appointment.countDocuments({
      athleteId,
      facilityId: facility._id,
      status: AppointmentStatus.NoShow,
    }),
    User.findById(athleteId),
  ]);

  if (!athlete) {
    throw new AppError('Athlete not found', 404);
  }

  const totalNoShows = reservationNoShows + appointmentNoShows;
  const allowedNoShows = facility.allowedNoShows;
  let athleteBlockedInFacility = (athlete.blockedFacilities ?? []).some(
    (blockedFacilityId) => blockedFacilityId.toString() === facility._id.toString(),
  );

  if (totalNoShows >= allowedNoShows && !athleteBlockedInFacility) {
    athlete.blockedFacilities = [...(athlete.blockedFacilities ?? []), facility._id];
    await athlete.save();
    athleteBlockedInFacility = true;
  }

  return {
    totalNoShows,
    allowedNoShows,
    athleteBlockedInFacility,
  };
};

const getResourceByEmployee = async (employeeId: string, resourceId: string) => {
  validateObjectId(resourceId, 'resource id');

  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  await getFacilityByEmployee(employeeId, resource.facilityId.toString());

  return resource;
};

const validateSports = async (sports: unknown, minimumCount: number) => {
  if (!Array.isArray(sports)) {
    throw new AppError('sports must be an array', 400);
  }

  const sportIds = sports
    .map((sportId) => String(sportId).trim())
    .filter(Boolean);

  const uniqueIds = [...new Set(sportIds)];

  if (uniqueIds.length < minimumCount) {
    throw new AppError(`sports must contain at least ${minimumCount} item`, 400);
  }

  for (const sportId of uniqueIds) {
    if (!Types.ObjectId.isValid(sportId)) {
      throw new AppError('sports must contain valid sport IDs', 400);
    }
  }

  const objectIds = uniqueIds.map((sportId) => new Types.ObjectId(sportId));
  const foundSports = await Sport.find({
    _id: { $in: objectIds },
    active: true,
  });

  if (!(foundSports.length === objectIds.length)) {
    throw new AppError('All sports must reference existing active sports', 400);
  }

  return objectIds;
};

const validateFavoriteSports = async (favoriteSports: unknown) => {
  if (!Array.isArray(favoriteSports)) {
    throw new AppError('favoriteSports must be an array', 400);
  }

  const sportIds = favoriteSports.map((sportId) => String(sportId).trim());

  if (sportIds.some((sportId) => !sportId)) {
    throw new AppError('favoriteSports must contain valid sport IDs', 400);
  }

  const uniqueIds = [...new Set(sportIds)];

  if (!(uniqueIds.length === sportIds.length)) {
    throw new AppError('favoriteSports must contain unique sport IDs', 400);
  }

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

  return validateSports(uniqueIds, 0);
};

const validateOpeningHours = (openingHours: unknown) => {
  if (!Array.isArray(openingHours)) {
    throw new AppError('openingHours must be an array', 400);
  }

  const seenDays = new Set<number>();

  return openingHours.map((item, index) => {
    const day = Number((item as IOpeningHour | undefined)?.day);
    const open = String((item as IOpeningHour | undefined)?.open ?? '').trim();
    const close = String((item as IOpeningHour | undefined)?.close ?? '').trim();

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new AppError(`openingHours[${index}].day must be an integer from 0 to 6`, 400);
    }

    if (seenDays.has(day)) {
      throw new AppError('openingHours must not contain duplicate days', 400);
    }

    seenDays.add(day);

    if (!timePattern.test(open)) {
      throw new AppError(`openingHours[${index}].open must be in HH:mm format`, 400);
    }

    if (!timePattern.test(close)) {
      throw new AppError(`openingHours[${index}].close must be in HH:mm format`, 400);
    }

    if (close <= open) {
      throw new AppError(`openingHours[${index}].close must be after open`, 400);
    }

    return { day, open, close };
  });
};

const validateCoordinates = (longitudeValue: unknown, latitudeValue: unknown) => {
  const longitude = Number(longitudeValue);
  const latitude = Number(latitudeValue);

  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError('longitude must be from -180 to 180', 400);
  }

  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError('latitude must be from -90 to 90', 400);
  }

  return { longitude, latitude };
};

const validateHourlyPrice = (value: unknown) => {
  const hourlyPrice = Number(value);

  if (Number.isNaN(hourlyPrice) || hourlyPrice < 0) {
    throw new AppError('hourlyPrice must be greater than or equal to 0', 400);
  }

  return hourlyPrice;
};

const validateAllowedNoShows = (value: unknown) => {
  const allowedNoShows = Number(value);

  if (!Number.isInteger(allowedNoShows) || allowedNoShows < 0) {
    throw new AppError('allowedNoShows must be a non-negative integer', 400);
  }

  return allowedNoShows;
};

const validateResourceType = (value: unknown) => {
  const type = String(value ?? '').trim() as ResourceType;

  if (!Object.values(ResourceType).includes(type)) {
    throw new AppError('type must be a valid resource type', 400);
  }

  return type;
};

const validateResourceCapacity = (value: unknown, type: ResourceType) => {
  const capacity = Number(value);

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new AppError('capacity must be a positive integer', 400);
  }

  if (type === ResourceType.Outdoor && capacity < 4) {
    throw new AppError('outdoor resource capacity must be at least 4', 400);
  }

  return capacity;
};

const validateEquipmentDescription = (value: unknown) => {
  const equipmentDescription = requireTrimmedText(value, 'equipmentDescription');

  if (equipmentDescription.length > 300) {
    throw new AppError('equipmentDescription must be at most 300 characters', 400);
  }

  return equipmentDescription;
};

const validateBiography = (value: unknown) => {
  const biography = requireTrimmedText(value, 'biography');

  if (biography.length > 1000) {
    throw new AppError('biography must be at most 1000 characters', 400);
  }

  return biography;
};

const validatePricePerHour = (value: unknown) => {
  const pricePerHour = Number(value);

  if (Number.isNaN(pricePerHour) || pricePerHour < 0) {
    throw new AppError('pricePerHour must be greater than or equal to 0', 400);
  }

  return pricePerHour;
};

const validateFacilitySport = async (
  facility: IFacility,
  sportIdValue: unknown,
) => {
  const sportId = String(sportIdValue ?? '').trim();
  validateObjectId(sportId, 'sport id');

  if (!(facility.sports ?? []).some((item) => item.toString() === sportId)) {
    throw new AppError('sport must belong to the facility sports', 400);
  }

  const sport = await Sport.findOne({
    _id: new Types.ObjectId(sportId),
    active: true,
  }).select('name');

  if (!sport || !sport._id) {
    throw new AppError('sport must reference an existing active sport', 400);
  }

  return {
    sportId: sport._id,
    sportName: sport.name,
  };
};

const countOtherActiveOutdoorResources = async (
  facilityId: Types.ObjectId,
  excludedResourceId?: Types.ObjectId,
) => {
  const filters: Record<string, unknown> = {
    facilityId,
    type: ResourceType.Outdoor,
    active: true,
  };

  if (excludedResourceId) {
    filters._id = { $ne: excludedResourceId };
  }

  return Resource.countDocuments(filters);
};

const ensureOutdoorRequirementAfterChange = async (
  resource: IResource,
  nextType: ResourceType,
  nextActive: boolean,
) => {
  const currentlyActiveOutdoor =
    resource.type === ResourceType.Outdoor && resource.active === true;
  const nextActiveOutdoor =
    nextType === ResourceType.Outdoor && nextActive === true;

  if (!currentlyActiveOutdoor || nextActiveOutdoor) {
    return;
  }

  const otherActiveOutdoorCount = await countOtherActiveOutdoorResources(
    resource.facilityId,
    resource._id,
  );

  if (otherActiveOutdoorCount === 0) {
    throw new AppError('Facility must contain at least one active outdoor resource', 400);
  }
};

const validateResourcePayload = async (
  facility: IFacility,
  body: CreateEmployeeResourceBody | UpdateEmployeeResourceBody,
) => {
  const name = requireTrimmedText(body.name, 'name');
  const type = validateResourceType(body.type);
  const { sportId, sportName } = await validateFacilitySport(facility, body.sportId);
  const capacity = validateResourceCapacity(body.capacity, type);
  const equipmentDescription = validateEquipmentDescription(body.equipmentDescription);

  return {
    name,
    type,
    sportId,
    sportName,
    capacity,
    equipmentDescription,
  };
};

const requireTrimmedText = (value: unknown, fieldName: string) => {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  return text;
};

const getProfile = async (employeeId: string) => {
  const user = await getEmployee(employeeId);

  return {
    employee: toEmployeeProfile(user),
  };
};

const updateProfile = async (employeeId: string, body: UpdateEmployeeProfileBody) => {
  const user = await User.findById(employeeId);

  if (!user || !(user.role === UserRole.Employee)) {
    throw new AppError('Employee not found', 404);
  }

  if (!user.employeeData) {
    throw new AppError('employeeData is required for employees', 400);
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const companyName =
    typeof body.employeeData?.companyName === 'string'
      ? body.employeeData.companyName.trim()
      : '';
  const headOfficeAddress =
    typeof body.employeeData?.headOfficeAddress === 'string'
      ? body.employeeData.headOfficeAddress.trim()
      : '';

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

  if (!emailPattern.test(email)) {
    throw new AppError('email must be valid', 400);
  }

  if (!companyName) {
    throw new AppError('employeeData.companyName is required', 400);
  }

  if (!headOfficeAddress) {
    throw new AppError('employeeData.headOfficeAddress is required', 400);
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
  user.employeeData.companyName = companyName;
  user.employeeData.headOfficeAddress = headOfficeAddress;

  await user.save();

  const updatedUser = await getEmployee(employeeId);

  return {
    employee: toEmployeeProfile(updatedUser),
  };
};

const getFacilities = async (employeeId: string) => {
  await getEmployeeAsUser(employeeId);

  const facilities = (await Facility.find({
    employeeIds: new Types.ObjectId(employeeId),
  })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .sort({ name: 1 })
    .lean()) as unknown as FacilityWithSports[];

  return {
    facilities: facilities.map((facility) => toEmployeeFacility(facility)),
  };
};

const createFacility = async (employeeId: string, body: CreateEmployeeFacilityBody) => {
  const employee = await getEmployeeAsUser(employeeId);

  const name = requireTrimmedText(body.name, 'name');
  const city = requireTrimmedText(body.city, 'city');
  const country = requireTrimmedText(body.country, 'country');
  const address = requireTrimmedText(body.address, 'address');
  const description = requireTrimmedText(body.description, 'description');
  const { longitude, latitude } = validateCoordinates(body.longitude, body.latitude);
  const sports = await validateSports(body.sports ?? [], 1);
  const openingHours = validateOpeningHours(body.openingHours ?? []);
  const hourlyPrice = validateHourlyPrice(body.hourlyPrice);
  const allowedNoShows = validateAllowedNoShows(body.allowedNoShows);
  const images = Array.isArray(body.images)
    ? body.images.map((image) => String(image).trim()).filter(Boolean)
    : [];

  const createdFacility = await Facility.create({
    name,
    city,
    country,
    address,
    description,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    sports,
    openingHours,
    hourlyPrice,
    allowedNoShows,
    images,
    employeeIds: [employee._id],
    status: FacilityStatus.Pending,
    active: false,
    createdAt: new Date(),
  });

  const facility = (await Facility.findById(createdFacility._id)
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean()) as unknown as FacilityWithSports | null;

  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  return {
    facility: toEmployeeFacility(facility),
  };
};

const getFacility = async (employeeId: string, facilityId: string) => {
  const facility = await getFacilityByEmployeeWithSports(employeeId, facilityId);

  return {
    facility: toEmployeeFacility(facility),
  };
};

const updateFacility = async (
  employeeId: string,
  facilityId: string,
  body: UpdateEmployeeFacilityBody,
) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);

  const name = requireTrimmedText(body.name, 'name');
  const city = requireTrimmedText(body.city, 'city');
  const country = requireTrimmedText(body.country, 'country');
  const address = requireTrimmedText(body.address, 'address');
  const description = requireTrimmedText(body.description, 'description');
  const { longitude, latitude } = validateCoordinates(body.longitude, body.latitude);
  const sports = await validateSports(body.sports ?? [], 1);
  const openingHours = validateOpeningHours(body.openingHours ?? []);
  const hourlyPrice = validateHourlyPrice(body.hourlyPrice);
  const allowedNoShows = validateAllowedNoShows(body.allowedNoShows);

  facility.name = name;
  facility.city = city;
  facility.country = country;
  facility.address = address;
  facility.description = description;
  facility.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  facility.sports = sports;
  facility.openingHours = openingHours;
  facility.hourlyPrice = hourlyPrice;
  facility.allowedNoShows = allowedNoShows;

  await facility.save();

  const updatedFacility = await getFacilityByEmployeeWithSports(employeeId, facilityId);

  return {
    facility: toEmployeeFacility(updatedFacility),
  };
};

const getFacilityResources = async (employeeId: string, facilityId: string) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);

  const resources = (await Resource.find({
    facilityId: facility._id,
  })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .sort({ name: 1 })
    .lean()) as unknown as PopulatedResource[];

  return {
    resources: resources.map((resource) => toEmployeeResource(resource)),
  };
};

const createResource = async (
  employeeId: string,
  facilityId: string,
  body: CreateEmployeeResourceBody,
) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);
  const payload = await validateResourcePayload(facility, body);

  const existingResource = await Resource.findOne({
    facilityId: facility._id,
    name: payload.name,
  });

  if (existingResource) {
    throw new AppError('Resource name must be unique inside the facility', 400);
  }

  const createdResource = await Resource.create({
    facilityId: facility._id,
    name: payload.name,
    type: payload.type,
    sportId: payload.sportId,
    capacity: payload.capacity,
    equipmentDescription: payload.equipmentDescription,
    active: true,
  });

  const resource = (await Resource.findById(createdResource._id)
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as PopulatedResource | null;

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  return {
    resource: toEmployeeResource(resource),
  };
};

const updateResource = async (
  employeeId: string,
  resourceId: string,
  body: UpdateEmployeeResourceBody,
) => {
  const resource = await getResourceByEmployee(employeeId, resourceId);
  const facility = await getFacilityByEmployee(employeeId, resource.facilityId.toString());
  const payload = await validateResourcePayload(facility, body);
  const active = typeof body.active === 'boolean' ? body.active : resource.active;

  const existingResource = await Resource.findOne({
    facilityId: facility._id,
    name: payload.name,
    _id: { $ne: resource._id },
  });

  if (existingResource) {
    throw new AppError('Resource name must be unique inside the facility', 400);
  }

  await ensureOutdoorRequirementAfterChange(resource, payload.type, active);

  resource.name = payload.name;
  resource.type = payload.type;
  resource.sportId = payload.sportId;
  resource.capacity = payload.capacity;
  resource.equipmentDescription = payload.equipmentDescription;
  resource.active = active;

  await resource.save();

  const updatedResource = (await Resource.findById(resource._id)
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as PopulatedResource | null;

  if (!updatedResource) {
    throw new AppError('Resource not found', 404);
  }

  return {
    resource: toEmployeeResource(updatedResource),
  };
};

const deleteResource = async (employeeId: string, resourceId: string) => {
  const resource = await getResourceByEmployee(employeeId, resourceId);

  await ensureOutdoorRequirementAfterChange(resource, resource.type, false);

  const futureReservation = await Reservation.findOne({
    resourceId: resource._id,
    status: { $ne: ReservationStatus.Cancelled },
    startTime: { $gt: new Date() },
  }).select('_id');

  if (futureReservation) {
    throw new AppError('Resource cannot be deleted because it has future non-cancelled reservations', 400);
  }

  await Resource.deleteOne({ _id: resource._id });

  return {
    message: 'Resource deleted successfully',
  };
};

const getFacilityTrainers = async (employeeId: string, facilityId: string) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);

  const trainers = (await Trainer.find({
    facilityId: facility._id,
  })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .sort({ lastName: 1, firstName: 1 })
    .lean()) as unknown as PopulatedTrainer[];

  return {
    trainers: trainers.map((trainer) => toEmployeeTrainer(trainer)),
  };
};

const createTrainer = async (
  employeeId: string,
  facilityId: string,
  body: CreateEmployeeTrainerBody,
) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);
  const firstName = requireTrimmedText(body.firstName, 'firstName');
  const lastName = requireTrimmedText(body.lastName, 'lastName');
  const email = requireTrimmedText(body.email, 'email').toLowerCase();
  const phone = requireTrimmedText(body.phone, 'phone');
  const sports = await validateSports(body.sports ?? [], 1);
  const workingHours = validateOpeningHours(body.workingHours ?? []);
  const biography = validateBiography(body.biography);
  const pricePerHour = validatePricePerHour(body.pricePerHour);

  if (!emailPattern.test(email)) {
    throw new AppError('email must be valid', 400);
  }

  const existingTrainer = await Trainer.findOne({ email });

  if (existingTrainer) {
    throw new AppError('email already exists', 409);
  }

  const createdTrainer = await Trainer.create({
    firstName,
    lastName,
    email,
    phone,
    facilityId: facility._id,
    sports,
    workingHours,
    biography,
    pricePerHour,
    active: true,
    createdAt: new Date(),
  });

  const trainer = (await Trainer.findById(createdTrainer._id)
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean()) as unknown as PopulatedTrainer | null;

  if (!trainer) {
    throw new AppError('Trainer not found', 404);
  }

  return {
    trainer: toEmployeeTrainer(trainer),
  };
};

const updateTrainer = async (
  employeeId: string,
  trainerId: string,
  body: UpdateEmployeeTrainerBody,
) => {
  validateObjectId(trainerId, 'trainer id');

  const trainer = await Trainer.findById(trainerId);

  if (!trainer) {
    throw new AppError('Trainer not found', 404);
  }

  await getFacilityByEmployee(employeeId, trainer.facilityId.toString());

  const firstName = requireTrimmedText(body.firstName, 'firstName');
  const lastName = requireTrimmedText(body.lastName, 'lastName');
  const email = requireTrimmedText(body.email, 'email').toLowerCase();
  const phone = requireTrimmedText(body.phone, 'phone');
  const sports = await validateSports(body.sports ?? [], 1);
  const workingHours = validateOpeningHours(body.workingHours ?? []);
  const biography = validateBiography(body.biography);
  const pricePerHour = validatePricePerHour(body.pricePerHour);
  const active = typeof body.active === 'boolean' ? body.active : trainer.active;

  if (!emailPattern.test(email)) {
    throw new AppError('email must be valid', 400);
  }

  const existingTrainer = await Trainer.findOne({
    email,
    _id: { $ne: trainer._id },
  });

  if (existingTrainer) {
    throw new AppError('email already exists', 409);
  }

  trainer.firstName = firstName;
  trainer.lastName = lastName;
  trainer.email = email;
  trainer.phone = phone;
  trainer.sports = sports;
  trainer.workingHours = workingHours;
  trainer.biography = biography;
  trainer.pricePerHour = pricePerHour;
  trainer.active = active;

  await trainer.save();

  const updatedTrainer = (await Trainer.findById(trainer._id)
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean()) as unknown as PopulatedTrainer | null;

  if (!updatedTrainer) {
    throw new AppError('Trainer not found', 404);
  }

  return {
    trainer: toEmployeeTrainer(updatedTrainer),
  };
};

const deleteTrainer = async (employeeId: string, trainerId: string) => {
  validateObjectId(trainerId, 'trainer id');

  const trainer = await Trainer.findById(trainerId);

  if (!trainer) {
    throw new AppError('Trainer not found', 404);
  }

  await getFacilityByEmployee(employeeId, trainer.facilityId.toString());

  const futureAppointment = await Appointment.findOne({
    trainerId: trainer._id,
    startTime: { $gt: new Date() },
    status: { $ne: AppointmentStatus.Cancelled },
  }).select('_id');

  if (futureAppointment) {
    throw new AppError('Trainer cannot be deleted because of future non-cancelled appointments', 400);
  }

  await Trainer.deleteOne({ _id: trainer._id });

  return {
    message: 'Trainer deleted successfully',
  };
};

const getAttendance = async (
  employeeId: string,
  facilityId: string,
  query: AttendanceQuery,
) => {
  const facility = await getFacilityByEmployee(employeeId, facilityId);
  const attendanceType = query.type?.trim() || 'all';

  if (!['all', 'reservations', 'trainings'].includes(attendanceType)) {
    throw new AppError('type must be one of reservations or trainings', 400);
  }

  const filters: {
    startTime?: {
      $gte: Date;
      $lt: Date;
    };
  } = {};

  if (query.date?.trim()) {
    const parsedDate = parseDateOnly(query.date.trim());
    const nextDate = new Date(parsedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    filters.startTime = {
      $gte: parsedDate,
      $lt: nextDate,
    };
  }

  const reservationsPromise =
    attendanceType === 'trainings'
      ? Promise.resolve([] as AttendanceReservation[])
      : Reservation.find({
          facilityId: facility._id,
          ...filters,
        })
          .populate({
            path: 'athleteId',
            select: 'firstName lastName',
          })
          .populate({
            path: 'resourceId',
            select: 'name',
          })
          .populate({
            path: 'sportId',
            select: 'name',
          })
          .lean() as unknown as Promise<AttendanceReservation[]>;

  const appointmentsPromise =
    attendanceType === 'reservations'
      ? Promise.resolve([] as AttendanceAppointment[])
      : Appointment.find({
          facilityId: facility._id,
          ...filters,
        })
          .populate({
            path: 'athleteId',
            select: 'firstName lastName',
          })
          .populate({
            path: 'trainerId',
            select: 'firstName lastName',
          })
          .populate({
            path: 'sportId',
            select: 'name',
          })
          .lean() as unknown as Promise<AttendanceAppointment[]>;

  const [reservations, appointments] = await Promise.all([
    reservationsPromise,
    appointmentsPromise,
  ]);

  const items = [
    ...reservations.map((reservation) => toAttendanceReservationItem(reservation)),
    ...appointments.map((appointment) => toAttendanceAppointmentItem(appointment)),
  ].sort((first, second) => first.startTime.getTime() - second.startTime.getTime());

  return {
    items,
  };
};

const markReservationAttendance = async (
  employeeId: string,
  reservationId: string,
  nextStatus: ReservationStatus.Attended | ReservationStatus.NoShow,
) => {
  validateObjectId(reservationId, 'reservation id');

  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  const facility = (await getFacilityByEmployee(
    employeeId,
    reservation.facilityId.toString(),
  )) as IFacility & { _id: Types.ObjectId };

  if (
    !(reservation.status === ReservationStatus.Pending) &&
    !(reservation.status === ReservationStatus.Confirmed)
  ) {
    throw new AppError('Only pending or confirmed reservations can be updated', 400);
  }

  ensureAttendanceWindow(reservation.startTime);

  reservation.status = nextStatus;
  await reservation.save();

  const updatedReservation = (await Reservation.findById(reservation._id)
    .populate({
      path: 'athleteId',
      select: 'firstName lastName',
    })
    .populate({
      path: 'resourceId',
      select: 'name',
    })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as AttendanceReservation | null;

  if (!updatedReservation) {
    throw new AppError('Reservation not found', 404);
  }

  const result: AttendanceUpdateResult = {
    item: toAttendanceReservationItem(updatedReservation),
  };

  if (nextStatus === ReservationStatus.NoShow) {
    Object.assign(result, await evaluateNoShowBlocking(reservation.athleteId, facility));
  }

  return result;
};

const markTrainingAttendance = async (
  employeeId: string,
  appointmentId: string,
  nextStatus: AppointmentStatus.Completed | AppointmentStatus.NoShow,
) => {
  validateObjectId(appointmentId, 'appointment id');

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Training appointment not found', 404);
  }

  const facility = (await getFacilityByEmployee(
    employeeId,
    appointment.facilityId.toString(),
  )) as IFacility & { _id: Types.ObjectId };

  if (!(appointment.status === AppointmentStatus.Scheduled)) {
    throw new AppError('Only scheduled training appointments can be updated', 400);
  }

  ensureAttendanceWindow(appointment.startTime);

  appointment.status = nextStatus;
  await appointment.save();

  const updatedAppointment = (await Appointment.findById(appointment._id)
    .populate({
      path: 'athleteId',
      select: 'firstName lastName',
    })
    .populate({
      path: 'trainerId',
      select: 'firstName lastName',
    })
    .populate({
      path: 'sportId',
      select: 'name',
    })
    .lean()) as unknown as AttendanceAppointment | null;

  if (!updatedAppointment) {
    throw new AppError('Training appointment not found', 404);
  }

  const result: AttendanceUpdateResult = {
    item: toAttendanceAppointmentItem(updatedAppointment),
  };

  if (nextStatus === AppointmentStatus.NoShow) {
    Object.assign(result, await evaluateNoShowBlocking(appointment.athleteId, facility));
  }

  return result;
};

export {
  getAttendance,
  markReservationAttendance,
  markTrainingAttendance,
  createFacility,
  createResource,
  createTrainer,
  deleteResource,
  deleteTrainer,
  getFacilities,
  getFacility,
  getFacilityResources,
  getFacilityTrainers,
  getProfile,
  updateProfile,
  updateFacility,
  updateResource,
  updateTrainer,
};
