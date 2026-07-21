import { Types } from 'mongoose';

import { User, UserRole, UserStatus, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  RegistratingUser,
  ResolvedRegistrationResponse,
  PendingRegistrationsResponse,
} from './admin.types';

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

  if (user.role !== UserRole.Athlete && user.role !== UserRole.Employee) {
    throw new AppError('Only athlete and employee registrations can be processed', 400);
  }

  if (user.status !== UserStatus.Pending) {
    throw new AppError('Only pending registration requests can be processed', 400);
  }

  return user;
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

export {
  approveRegistrationRequest,
  getRegistrationRequests,
  rejectRegistrationRequest,
};
