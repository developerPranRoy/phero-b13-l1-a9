import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as UserRepo from "../models/user.repository";
import { sendResponse } from "../utils/sendResponse";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/AppError";
import { ENV } from "../config/env";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId: string, email: string, name: string): string => {
  return jwt.sign({ userId, email, name }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, photoURL, password } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError("Name, email and password are required");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError("Invalid email format");
  }

  if (password.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters");
  }

  const existing = await UserRepo.findByEmail(email);
  if (existing) throw new ConflictError("Email is already registered");

  const hashed = await bcrypt.hash(password, 12);

  const user = await UserRepo.createUser({
    name,
    email,
    photo_url: photoURL ?? "",
    password: hashed,
    provider: "email",
  });

  sendResponse(res, 201, "Account created successfully", {
    user: { id: user.id, name: user.name, email: user.email, image: user.photo_url },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError("Email and password are required");

  const user = await UserRepo.findByEmail(email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError("Invalid email or password");

  const token = signToken(user.id, user.email, user.name);

  sendResponse(res, 200, "Login successful", {
    token,
    user: { id: user.id, name: user.name, email: user.email, image: user.photo_url },
  });
};

// Used by the frontend after a successful Google OAuth flow
export const issueJwt = async (req: Request, res: Response): Promise<void> => {
  const { email, name, photoURL } = req.body;
  if (!email) throw new BadRequestError("Email is required");

  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError("Invalid email format");
  }

  let user = await UserRepo.findByEmail(email);
  if (!user) {
    const hashed = await bcrypt.hash(Math.random().toString(36).slice(-8) + "Aa1!", 12);
    user = await UserRepo.createUser({
      name: name ?? "Google User",
      email,
      photo_url: photoURL ?? "",
      password: hashed,
      provider: "google",
    }) as UserRepo.User;
  }

  const token = signToken(user.id, user.email, user.name);
  sendResponse(res, 200, "Token issued", {
    token,
    user: { id: user.id, name: user.name, email: user.email, image: user.photo_url },
  });
};

// Development-only mock endpoint — disabled in production
export const googleMock = async (_req: Request, res: Response): Promise<void> => {
  if (ENV.IS_PROD) {
    throw new BadRequestError("This endpoint is not available in production");
  }

  const mockEmail = "googleuser@gmail.com";
  let user = await UserRepo.findByEmail(mockEmail);

  if (!user) {
    const hashed = await bcrypt.hash("MockPass1!", 12);
    user = await UserRepo.createUser({
      name: "Google User",
      email: mockEmail,
      photo_url: "https://i.pravatar.cc/150?u=googleuser",
      password: hashed,
      provider: "google",
    }) as UserRepo.User;
  }

  const token = signToken(user.id, user.email, user.name);
  sendResponse(res, 200, "Mock Google login successful", {
    token,
    user: { id: user.id, name: user.name, email: user.email, image: user.photo_url },
  });
};
