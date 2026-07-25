import { Types } from 'mongoose';

import { Facility, type IFacility } from '../../models/Facility';
import { Sport, type ISport } from '../../models/Sport';
import { User, UserRole, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  EmployeeFacility,
  EmployeeProfile,
  UpdateEmployeeProfileBody,
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    status: facility.status,
    active: facility.active,
    hourlyPrice: facility.hourlyPrice,
    images: facility.images ?? [],
    sports: sports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
    createdAt: facility.createdAt ?? new Date(),
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
  const employee = await User.findById(employeeId).select('_id role');

  if (!employee || !(employee.role === UserRole.Employee)) {
    throw new AppError('Employee not found', 404);
  }

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

export {
  getFacilities,
  getProfile,
  updateProfile,
};
