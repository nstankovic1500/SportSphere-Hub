import { Types } from 'mongoose';

import { Facility, FacilityStatus, type IFacility } from '../../models/Facility';
import { User, UserRole, UserStatus, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  PendingFacilityRequest,
  PendingFacilityRequestsResponse,
  RegistratingUser,
  ResolvedFacilityRequestResponse,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
} from './admin.types';

type FacilityRequestSport = {
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

const createSafeUser = (
  user: IUser & { _id: { toString(): string } },
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
    favoriteSports: (user.favoriteSports ?? []).map((sportId) => sportId.toString()),
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
    createdAt: facility.createdAt ?? new Date(),
  };
};

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
  }).sort({ createdAt: 1 });

  return {
    requests: users.map((user) => createSafeUser(user)),
  } as PendingRegistrationsResponse;
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
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  rejectFacilityRequest,
  rejectRegistrationRequest,
};
