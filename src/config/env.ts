import dotenv from "dotenv";
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const ENV = {
  PORT:           parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL:   required("DATABASE_URL"),
  JWT_SECRET:     required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // Comma-separated allowed origins e.g. "https://myapp.vercel.app,http://localhost:3000"
  CLIENT_URL:     process.env.CLIENT_URL || "",
  NODE_ENV:       process.env.NODE_ENV || "development",
  IS_PROD:        process.env.NODE_ENV === "production",
};
