import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as UserRepo from "../models/user.repository";
import { sendResponse } from "../utils/sendResponse";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/AppError";

const signToken = (userId: string, email: string, name: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ userId, email, name }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as string,
  } as jwt.SignOptions);
};


export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, photoURL, password } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError("Name, email and password are required");
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


export const issueJwt = async (req: Request, res: Response): Promise<void> => {
  const { email, name, photoURL } = req.body;
  if (!email) throw new BadRequestError("Email is required");

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


export const googleMock = async (_req: Request, res: Response): Promise<void> => {
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
