import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env';
import { Sport } from '../../models/Sport';
import { User, UserRole, UserStatus, type IUser } from '../../models/User';
import { AppError } from '../../utils/AppError';
import type {
  JwtPayload,
  LoginUser,
  RegisterEmployeeData,
  RegisterRequestBody,
  RegisterResponseData,
  RegisteredUser,
} from './auth.types';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password';
const jwtOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};
const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].{7,11}$/

const CreateUser = (user: IUser & { _id: { toString(): string } }): LoginUser => {
  return {
    id: user._id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    profileImage: user.profileImage,
  };
};

const createRegisteredUser = (user: IUser & { _id: { toString(): string } }): RegisteredUser => {
  const favoriteSports = (user.favoriteSports ?? []).map((sportId) => sportId.toString());
  const employeeData =
    user.employeeData &&
      user.employeeData.companyName &&
      user.employeeData.headOfficeAddress &&
      user.employeeData.registrationNumber &&
      user.employeeData.pib
      ? {
        companyName: user.employeeData.companyName,
        headOfficeAddress: user.employeeData.headOfficeAddress,
        registrationNumber: user.employeeData.registrationNumber,
        pib: user.employeeData.pib,
      }
      : undefined;

  return {
    id: user._id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    profileImage: user.profileImage ?? 'profiles/default-avatar.png',
    favoriteSports,
    role: user.role,
    status: user.status,
    employeeData,
    createdAt: user.createdAt ?? new Date(),
  };
};

const trimString = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const normalizeEmployeeData = (employeeData: RegisterRequestBody['employeeData']) => {
  if (!employeeData) {
    return undefined;
  }

  return {
    companyName: trimString(employeeData.companyName),
    headOfficeAddress: trimString(employeeData.headOfficeAddress),
    registrationNumber: trimString(employeeData.registrationNumber),
    pib: trimString(employeeData.pib),
  };
};

const ensureRequired = (value: string, fieldName: string) => {
  if (!value) {
    throw new AppError(`${fieldName} is required`, 400);
  }
};

const normalizeRegisterData = (body: RegisterRequestBody) => {
  return {
    username: trimString(body.username),
    password: trimString(body.password),
    firstName: trimString(body.firstName),
    lastName: trimString(body.lastName),
    phone: trimString(body.phone),
    email: trimString(body.email).toLowerCase(),
    role: trimString(body.role) as RegisterRequestBody['role'],
    favoriteSports: Array.isArray(body.favoriteSports)
      ? body.favoriteSports.map((sportId) => trimString(sportId))
      : body.favoriteSports,
    employeeData: normalizeEmployeeData(body.employeeData),
  };
};

const validatePassword = (password: string) => {
  if (!passwordPattern.test(password)) {
    throw new AppError(
      'Password must start with a letter, be 8 to 12 characters long, and include an uppercase letter, a number, and a special character',
      400,
    );
  }
};

const validateFavoriteSports = async (favoriteSports: unknown) => {
  if (!Array.isArray(favoriteSports)) {
    throw new AppError('favoriteSports must be an array', 400);
  }

  const uniqueIds = [...new Set(favoriteSports.filter((sportId) => sportId !== ''))];

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
    throw new AppError('All favoriteSports must reference existing sports', 400);
  }

  return objectIds;
};

const validateEmployeeData = async (employeeData: RegisterEmployeeData | undefined) => {
  if (!employeeData) {
    throw new AppError('employeeData is required for registration', 400);
  }

  ensureRequired(employeeData.companyName, 'companyName');
  ensureRequired(employeeData.headOfficeAddress, 'headOfficeAddress');

  if (!/^\d{8}$/.test(employeeData.registrationNumber)) {
    throw new AppError('registrationNumber must contain exactly 8 digits', 400);
  }

  if (!/^[1-9]\d{8}$/.test(employeeData.pib)) {
    throw new AppError('pib cannot start with 0 and must contain exactly 9 digits', 400);
  }

  const existingRegistrationNumber = await User.findOne({
    "employeeData.registrationNumber": employeeData.registrationNumber,
  });

  if (existingRegistrationNumber) {
    throw new AppError("Registration number already exists.", 409);
  }

  const existingPib = await User.findOne({
    "employeeData.pib": employeeData.pib,
  });

  if (existingPib) {
    throw new AppError("PIB already exists.", 409);
  }

  const sameCompanyCount = await User.countDocuments({
    role: UserRole.Employee,
    "employeeData.companyName": employeeData.companyName,
  });

  if (sameCompanyCount >= 2) {
    throw new AppError(
      "Only two employee users may be registered for the same company.",
      400
    );
  }
};

function handleDuplicateKeyError(error: any) {
  if (error.code !== 11000) {
    throw error;
  }

  const field = Object.keys(error.keyPattern)[0];
  throw new AppError(`${field} already exists`, 409);
}

const loginWithRole = async (
  username: string,
  password: string,
  role?: UserRole,
) => {
  const user = await User.findOne({ username }).select('+passwordHash');

  if (!user) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  if ((role !== undefined && user.role !== role) || (role === undefined && user.role === UserRole.Admin)) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  if (user.status !== UserStatus.Approved) {
    throw new AppError('Only approved users may log in', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const newUser = CreateUser(user);
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    env.JWT_SECRET,
    jwtOptions,
  );

  return {
    token,
    user: newUser,
  };
};

const login = async (username: string, password: string) => {
  return loginWithRole(username, password, undefined);
};

const adminLogin = async (username: string, password: string) => {
  return loginWithRole(username, password, UserRole.Admin);
};

const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('Invalid or expired token', 401);
  }

  return CreateUser(user);
};

const register = async (body: RegisterRequestBody) => {
  const data = normalizeRegisterData(body);

  ensureRequired(data.username, 'username');
  ensureRequired(data.password, 'password');
  ensureRequired(data.firstName, 'firstName');
  ensureRequired(data.lastName, 'lastName');
  ensureRequired(data.phone, 'phone');
  ensureRequired(data.email, 'email');
  ensureRequired(data.role, 'role');

  if (data.role !== UserRole.Athlete && data.role !== UserRole.Employee) {
    throw new AppError('Only athlete and employee roles are allowed', 400);
  }

  validatePassword(data.password);

  const favoriteSports = await validateFavoriteSports(data.favoriteSports);

  if (data.role === UserRole.Employee) {
    await validateEmployeeData(data.employeeData);
  }

  if (data.role === UserRole.Athlete && data.employeeData !== undefined) {
    throw new AppError('employeeData must be omitted for athlete registration', 400);
  }

  const [existingUsername, existingEmail] = await Promise.all([
    User.findOne({ username: data.username }),
    User.findOne({ email: data.email }),
  ]);

  if (existingUsername) {
    throw new AppError('username already exists', 409);
  }

  if (existingEmail) {
    throw new AppError('email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const createdAt = new Date();

  try {
    const user = await User.create({
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      profileImage: 'profiles/default-avatar.png',
      favoriteSports,
      role: data.role,
      status: UserStatus.Pending,
      employeeData: data.role === UserRole.Employee ? data.employeeData : undefined,
      blockedFacilities: [],
      createdAt,
    });

    return {
      user: createRegisteredUser(user),
    } as RegisterResponseData;
  } catch (error) {
    handleDuplicateKeyError(error);
  }
};

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

export { adminLogin, getCurrentUser, login, register, verifyToken };
