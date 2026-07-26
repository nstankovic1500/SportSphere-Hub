import type { Request, Response } from 'express';

import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import type {
  AuthenticatedRequest,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
} from './auth.types';
import {
  adminLogin as adminLoginService,
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  login as loginService,
  register as registerService,
  resetPassword as resetPasswordService,
} from './auth.service';

const parseFavoriteSports = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((sportId) => String(sportId));
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmedValue);
      return Array.isArray(parsed) ? parsed.map((sportId) => String(sportId)) : [];
    } catch {
      return [];
    }
  }

  return [];
};

const parseEmployeeData = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return undefined;
    }

    try {
      return JSON.parse(trimmedValue);
    } catch {
      return undefined;
    }
  }

  if (value && typeof value === 'object') {
    return value;
  }

  return undefined;
};

const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await loginService(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginRequestBody;
  const data = await adminLoginService(body.username, body.password);

  res.status(200).json({
    success: true,
    data,
  });
});

const register = asyncHandler(async (req: Request, res: Response) => {
  const rawBody = req.body as Record<string, unknown>;
  const body: RegisterRequestBody = {
    username: String(rawBody.username ?? ''),
    password: String(rawBody.password ?? ''),
    firstName: String(rawBody.firstName ?? ''),
    lastName: String(rawBody.lastName ?? ''),
    phone: String(rawBody.phone ?? ''),
    email: String(rawBody.email ?? ''),
    role: String(rawBody.role ?? '') as RegisterRequestBody['role'],
    favoriteSports: parseFavoriteSports(rawBody.favoriteSports),
    employeeData: parseEmployeeData(rawBody.employeeData),
  };
  const data = await registerService(body, req.file);

  res.status(201).json({
    success: true,
    message: 'Zahtev za registraciju je uspešno kreiran.',
    data,
  });
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordRequestBody;
  const data = await forgotPasswordService(body.identifier);

  res.status(200).json({
    success: true,
    message: 'Link za resetovanje lozinke je uspešno generisan.',
    data,
  });
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ResetPasswordRequestBody;
  const token = String(req.params.token ?? '').trim();

  if (!token) {
    throw new AppError('Reset token je obavezan', 400);
  }

  await resetPasswordService(token, body.password);

  res.status(200).json({
    success: true,
    message: 'Lozinka je uspešno resetovana.',
    data: {},
  });
});

const currentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.auth) {
    throw new AppError('Token nije važeći ili je istekao', 401);
  }

  const data = await getCurrentUser(req.auth.userId);

  res.status(200).json({
    success: true,
    data: {
      user: data,
    },
  });
});

export { adminLogin, currentUser, forgotPassword, login, register, resetPassword };
