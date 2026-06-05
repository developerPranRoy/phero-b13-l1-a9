import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface IJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: IJwtPayload;
}

export interface Booking {
  id: string;
  tutor_id: string;
  tutor_name: string;
  student_name: string;
  student_email: string;
  phone: string;
  status: "pending" | "cancelled";
  session_token: string;
  booked_at: Date;
  created_at: Date;
  updated_at: Date;
}



export interface TutorFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  limit?: number;
  page?: number;
}

