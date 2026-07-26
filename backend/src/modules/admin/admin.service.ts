import { Types } from 'mongoose';

import { Facility, FacilityStatus, type IFacility } from '../../models/Facility';
import { Sport, type ISport } from '../../models/Sport';
import { Trainer, type ITrainer } from '../../models/Trainer';
import { User, UserRole, UserStatus, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  AdminSport,
  AdminSportsResponse,
  AdminTrainer,
  AdminTrainersResponse,
  AdminUser,
  AdminUsersResponse,
  CreateAdminSportBody,
  PendingFacilityRequest,
  PendingFacilityRequestsResponse,
  RegistratingUser,
  ResolvedAdminSportResponse,
  ResolvedAdminTrainerResponse,
  ResolvedAdminUserResponse,
  ResolvedFacilityRequestResponse,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
  UpdateAdminUserBody,
} from './admin.types';

type FacilityRequestSport = {
  _id: Types.ObjectId;
  name: string;
};

type RegistrationFavoriteSport = {
  _id: Types.ObjectId;
  name: string;
};

type AdminTrainerSport = {
  _id: Types.ObjectId;
  name: string;
};

type FacilityRequestEmployee = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  employeeData?: {
    companyName?: string;
  };
};

type FacilityRequestWithRefs = IFacility & {
  _id: Types.ObjectId;
  sports: FacilityRequestSport[];
  employeeIds: FacilityRequestEmployee[];
};

type AdminTrainerFacility = {
  _id: Types.ObjectId;
  name: string;
  hourlyPrice?: number;
};

type AdminTrainerWithRefs = ITrainer & {
  _id: Types.ObjectId;
  facilityId: AdminTrainerFacility;
  sports: AdminTrainerSport[];
};

type AdminSportDocument = ISport & {
  _id: Types.ObjectId;
};

const toFavoriteSportName = (sport: Types.ObjectId | RegistrationFavoriteSport) =>
  'name' in (sport as RegistrationFavoriteSport) ? String((sport as RegistrationFavoriteSport).name) : sport.toString();

const toTrainerSportName = (sport: Types.ObjectId | AdminTrainerSport) =>
  'name' in (sport as AdminTrainerSport) ? String((sport as AdminTrainerSport).name) : sport.toString();

const createSafeUser = (
  user: IUser & {
    _id: { toString(): string };
    favoriteSports?: Array<Types.ObjectId | RegistrationFavoriteSport>;
  },
): RegistratingUser => {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    profileImage: user.profileImage ?? 'profiles/default-avatar.png',
    favoriteSports: (user.favoriteSports ?? []).map((sport) => toFavoriteSportName(sport)),
    role: user.role,
    status: user.status,
    employeeData: user.employeeData,
    createdAt: user.createdAt ?? new Date(),
  };
};

const findRegistratingUser = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid registration request id', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('Registration request not found', 404);
  }

  if (!(user.role === UserRole.Athlete) && !(user.role === UserRole.Employee)) {
    throw new AppError('Only athlete and employee registrations can be processed', 400);
  }

  if (!(user.status === UserStatus.Pending)) {
    throw new AppError('Only pending registration requests can be processed', 400);
  }

  return user;
};

const toFacilityRequest = (facility: FacilityRequestWithRefs): PendingFacilityRequest => {
  const sports = (facility.sports ?? []) as FacilityRequestSport[];
  const employees = (facility.employeeIds ?? []) as FacilityRequestEmployee[];

  return {
    id: facility._id.toString(),
    name: facility.name,
    city: facility.city,
    country: facility.country,
    address: facility.address,
    description: facility.description,
    status: facility.status,
    active: facility.active,
    hourlyPrice: facility.hourlyPrice,
    allowedNoShows: facility.allowedNoShows,
    images: facility.images ?? [],
    sports: sports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    employees: employees.map((employee) => ({
      id: employee._id.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      username: employee.username,
      email: employee.email,
      companyName: employee.employeeData?.companyName ?? '',
    })),
    openingHours: (facility.openingHours ?? []).map((openingHour) => ({
      day: openingHour.day,
      open: openingHour.open,
      close: openingHour.close,
    })),
    createdAt: facility.createdAt ?? new Date(),
  };
};

const toAdminUser = (
  user: IUser & {
    _id: Types.ObjectId;
    favoriteSports?: Array<Types.ObjectId | RegistrationFavoriteSport>;
  },
): AdminUser => ({
  id: user._id.toString(),
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  email: user.email,
  profileImage: user.profileImage ?? 'profiles/default-avatar.png',
  favoriteSports: (user.favoriteSports ?? []).map((sport) => toFavoriteSportName(sport)),
  role: user.role,
  status: user.status,
  employeeData: user.employeeData,
  createdAt: user.createdAt ?? new Date(),
});

const toAdminTrainer = (trainer: AdminTrainerWithRefs): AdminTrainer => ({
  id: trainer._id.toString(),
  firstName: trainer.firstName,
  lastName: trainer.lastName,
  email: trainer.email,
  phone: trainer.phone,
  facilityId: trainer.facilityId._id.toString(),
  facilityName: trainer.facilityId.name,
  sports: (trainer.sports ?? []).map((sport) => toTrainerSportName(sport)),
  pricePerHour:
    typeof trainer.pricePerHour === 'number'
      ? trainer.pricePerHour
      : typeof trainer.facilityId.hourlyPrice === 'number'
        ? trainer.facilityId.hourlyPrice
        : null,
  active: trainer.active,
  createdAt: trainer.createdAt ?? new Date(),
});

const toAdminSport = (sport: AdminSportDocument): AdminSport => ({
  id: sport._id.toString(),
  name: sport.name,
  active: sport.active,
});

const getFacilityWithRefs = async (id: string) => {
  const facility = (await Facility.findById(id)
    .populate({
      path: 'sports',
      select: 'name',
    })
    .populate({
      path: 'employeeIds',
      select: 'firstName lastName username email employeeData.companyName',
    })
    .lean()) as unknown as FacilityRequestWithRefs | null;

  if (!facility) {
    throw new AppError('Facility request not found', 404);
  }

  return facility;
};

const findPendingFacility = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid facility request id', 400);
  }

  const facility = await Facility.findById(id);

  if (!facility) {
    throw new AppError('Facility request not found', 404);
  }

  if (!(facility.status === FacilityStatus.Pending)) {
    throw new AppError('Only pending facility requests can be processed', 400);
  }

  return facility;
};

const getRegistrationRequests = async () => {
  const users = await User.find({
    status: UserStatus.Pending,
    role: { $in: [UserRole.Athlete, UserRole.Employee] },
  })
    .populate({
      path: 'favoriteSports',
      select: 'name',
    })
    .sort({ createdAt: 1 });

  return {
    requests: users.map((user) => createSafeUser(user)),
  } as PendingRegistrationsResponse;
};

const getUsers = async () => {
  const users = await User.find({})
    .populate({
      path: 'favoriteSports',
      select: 'name',
    })
    .sort({ createdAt: -1 });

  return {
    users: users.map((user) => toAdminUser(user as typeof user & { _id: Types.ObjectId })),
  } as AdminUsersResponse;
};

const updateUser = async (id: string, body: UpdateAdminUserBody) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user id', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? body.role : user.role;
  const status = typeof body.status === 'string' ? body.status : user.status;

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

  if (![UserRole.Admin, UserRole.Athlete, UserRole.Employee].includes(role)) {
    throw new AppError('role must be athlete, employee or admin', 400);
  }

  if (
    ![
      UserStatus.Pending,
      UserStatus.Approved,
      UserStatus.Rejected,
      UserStatus.Blocked,
    ].includes(status)
  ) {
    throw new AppError('status must be pending, approved, rejected or blocked', 400);
  }

  const existingEmailUser = await User.findOne({
    email,
    _id: { $ne: user._id },
  }).select('_id');

  if (existingEmailUser) {
    throw new AppError('email already exists', 409);
  }

  let favoriteSports: Types.ObjectId[] = [];

  if (Array.isArray(body.favoriteSports)) {
    favoriteSports = body.favoriteSports
      .filter((sportId) => Types.ObjectId.isValid(sportId))
      .map((sportId) => new Types.ObjectId(sportId));

    const validSportsCount = await Sport.countDocuments({
      _id: { $in: favoriteSports },
      active: true,
    });

    if (validSportsCount !== favoriteSports.length) {
      throw new AppError('favoriteSports must reference existing active sports', 400);
    }
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.phone = phone;
  user.email = email;
  user.role = role;
  user.status = status;
  user.favoriteSports = favoriteSports;

  if (role === UserRole.Employee) {
    const employeeData = body.employeeData;

    if (!employeeData?.companyName?.trim()) {
      throw new AppError('employeeData.companyName is required', 400);
    }

    if (!employeeData?.headOfficeAddress?.trim()) {
      throw new AppError('employeeData.headOfficeAddress is required', 400);
    }

    if (!employeeData?.registrationNumber?.trim()) {
      throw new AppError('employeeData.registrationNumber is required', 400);
    }

    if (!employeeData?.pib?.trim()) {
      throw new AppError('employeeData.pib is required', 400);
    }

    user.employeeData = {
      companyName: employeeData.companyName.trim(),
      headOfficeAddress: employeeData.headOfficeAddress.trim(),
      registrationNumber: employeeData.registrationNumber.trim(),
      pib: employeeData.pib.trim(),
    };
  } else {
    user.employeeData = undefined;
  }

  await user.save();

  const updatedUser = await User.findById(user._id).populate({
    path: 'favoriteSports',
    select: 'name',
  });

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  return {
    user: toAdminUser(updatedUser as typeof updatedUser & { _id: Types.ObjectId }),
  } as ResolvedAdminUserResponse;
};

const deleteUser = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user id', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.deleteOne();

  return {
    message: 'User deleted successfully',
  };
};

const getTrainers = async () => {
  const trainers = await Trainer.find({})
    .populate({
      path: 'facilityId',
      select: 'name hourlyPrice',
    })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .sort({ createdAt: -1 })
    .lean();

  return {
    trainers: trainers.map((trainer) => toAdminTrainer(trainer as unknown as AdminTrainerWithRefs)),
  } as AdminTrainersResponse;
};

const deactivateTrainer = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid trainer id', 400);
  }

  const updatedTrainer = await Trainer.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    { $set: { active: false } },
    { new: true },
  )
    .populate({
      path: 'facilityId',
      select: 'name hourlyPrice',
    })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .lean();

  if (!updatedTrainer) {
    throw new AppError('Trainer not found', 404);
  }

  return {
    trainer: toAdminTrainer(updatedTrainer as unknown as AdminTrainerWithRefs),
  } as ResolvedAdminTrainerResponse;
};

const getSports = async () => {
  const sports = await Sport.find({}).sort({ name: 1 }).lean();

  return {
    sports: sports.map((sport) => toAdminSport(sport as AdminSportDocument)),
  } as AdminSportsResponse;
};

const createSport = async (body: CreateAdminSportBody) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!name) {
    throw new AppError('name is required', 400);
  }

  const existingSport = await Sport.findOne({
    name: {
      $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      $options: 'i',
    },
  }).select('_id');

  if (existingSport) {
    throw new AppError('Sport already exists', 409);
  }

  const sport = await Sport.create({
    name,
    active: true,
  });

  return {
    sport: toAdminSport(sport as AdminSportDocument),
  } as ResolvedAdminSportResponse;
};

const approveRegistrationRequest = async (id: string) => {
  const user = await findRegistratingUser(id);

  user.status = UserStatus.Approved;
  await user.save();

  return {
    user: createSafeUser(user),
  } as ResolvedRegistrationResponse;
};

const rejectRegistrationRequest = async (id: string) => {
  const user = await findRegistratingUser(id);

  user.status = UserStatus.Rejected;
  await user.save();

  return {
    user: createSafeUser(user),
  } as ResolvedRegistrationResponse;
};

const getFacilityRequests = async () => {
  const facilities = (await Facility.find({
    status: FacilityStatus.Pending,
  })
    .populate({
      path: 'sports',
      select: 'name',
    })
    .populate({
      path: 'employeeIds',
      select: 'firstName lastName username email employeeData.companyName',
    })
    .sort({ createdAt: 1 })
    .lean()) as unknown as FacilityRequestWithRefs[];

  return {
    requests: facilities.map((facility) => toFacilityRequest(facility)),
  } as PendingFacilityRequestsResponse;
};

const approveFacilityRequest = async (id: string) => {
  const facility = await findPendingFacility(id);

  facility.status = FacilityStatus.Approved;
  facility.active = true;
  await facility.save();

  const updatedFacility = await getFacilityWithRefs(id);

  return {
    facility: toFacilityRequest(updatedFacility),
  } as ResolvedFacilityRequestResponse;
};

const rejectFacilityRequest = async (id: string) => {
  const facility = await findPendingFacility(id);

  facility.status = FacilityStatus.Rejected;
  facility.active = false;
  await facility.save();

  const updatedFacility = await getFacilityWithRefs(id);

  return {
    facility: toFacilityRequest(updatedFacility),
  } as ResolvedFacilityRequestResponse;
};

export {
  createSport,
  deactivateTrainer,
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  getSports,
  getTrainers,
  getUsers,
  rejectFacilityRequest,
  rejectRegistrationRequest,
  updateUser,
  deleteUser,
};
