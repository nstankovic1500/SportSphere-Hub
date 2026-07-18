import type { Request } from 'express';

import { type UserRole, type UserStatus } from '../../models/User';

interface LoginRequestBody {
  username: string;
  password: string;
}

interface RegisterEmployeeData {
  companyName: string;
  headOfficeAddress: string;
  registrationNumber: string;
  pib: string;
}

interface RegisterRequestBody {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: 'athlete' | 'employee';
  favoriteSports: string[];
  employeeData?: RegisterEmployeeData | null;
}

interface LoginUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
}

interface RegisteredUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  favoriteSports: string[];
  role: UserRole;
  status: UserStatus;
  employeeData?: RegisterEmployeeData;
  createdAt: Date;
}

interface LoginResponseData {
  token: string;
  user: LoginUser;
}

interface RegisterResponseData {
  user: RegisteredUser;
}

interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: LoginUser;
  auth?: JwtPayload;
}

export type {
  AuthenticatedRequest,
  JwtPayload,
  LoginRequestBody,
  LoginResponseData,
  LoginUser,
  RegisterEmployeeData,
  RegisterRequestBody,
  RegisterResponseData,
  RegisteredUser,
};
