import { Request, Response } from "express";
import * as TutorRepo from "../models/tutor.repository";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/AppError";


export const getTutors = async (req: Request, res: Response): Promise<void> => {
  const { search, startDate, endDate, createdBy, limit, page, all } = req.query;

  const { tutors, total } = await TutorRepo.findTutors({
    search: search as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    createdBy: createdBy as string | undefined,
    limit: all ? undefined : limit ? parseInt(limit as string, 10) : 20,
    page: page ? parseInt(page as string, 10) : 1,
  });

  sendResponse(res, 200, "Tutors fetched successfully", { tutors }, { total });
};


export const getTutorById = async (req: Request, res: Response): Promise<void> => {
  const tutor = await TutorRepo.findTutorById(req.params.id);
  if (!tutor) throw new NotFoundError("Tutor not found");
  sendResponse(res, 200, "Tutor fetched", tutor);
};


export const createTutor = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name, photo, subject, availableDays, availableTime,
    hourlyFee, totalSlot, sessionStartDate, institution,
    experience, location, teachingMode, createdBy,
  } = req.body;

  if (!name || !subject || !teachingMode) {
    throw new BadRequestError("Name, subject and teaching mode are required");
  }

  const tutor = await TutorRepo.createTutor({
    name,
    photo,
    subject,
    available_days: availableDays,
    available_time: availableTime,
    hourly_fee: Number(hourlyFee),
    total_slot: Number(totalSlot),
    session_start_date: new Date(sessionStartDate),
    institution,
    experience,
    location,
    teaching_mode: teachingMode,
    created_by: (createdBy ?? req.user?.email ?? "").toLowerCase(),
  });

  sendResponse(res, 201, "Tutor created successfully", { tutor });
};


export const updateTutor = async (req: AuthRequest, res: Response): Promise<void> => {
  const tutor = await TutorRepo.findTutorById(req.params.id);
  if (!tutor) throw new NotFoundError("Tutor not found");

  if (tutor.created_by !== req.user?.email?.toLowerCase()) {
    throw new ForbiddenError("You are not authorized to update this tutor");
  }


  const fieldMap: Record<string, keyof TutorRepo.Tutor> = {
    name: "name",
    photo: "photo",
    subject: "subject",
    availableDays: "available_days",
    availableTime: "available_time",
    hourlyFee: "hourly_fee",
    totalSlot: "total_slot",
    sessionStartDate: "session_start_date",
    institution: "institution",
    experience: "experience",
    location: "location",
    teachingMode: "teaching_mode",
  };

  const updates: Partial<Omit<TutorRepo.Tutor, "id" | "created_by" | "created_at" | "updated_at">> = {};

  for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
    if (req.body[bodyKey] !== undefined) {
      (updates as any)[dbKey] = req.body[bodyKey];
    }
  }

  const updated = await TutorRepo.updateTutor(req.params.id, updates);
  sendResponse(res, 200, "Tutor updated successfully", { tutor: updated });
};


export const deleteTutor = async (req: AuthRequest, res: Response): Promise<void> => {
  const tutor = await TutorRepo.findTutorById(req.params.id);
  if (!tutor) throw new NotFoundError("Tutor not found");

  if (tutor.created_by !== req.user?.email?.toLowerCase()) {
    throw new ForbiddenError("You are not authorized to delete this tutor");
  }

  await TutorRepo.deleteTutor(req.params.id);
  sendResponse(res, 200, "Tutor deleted successfully", null);
};
