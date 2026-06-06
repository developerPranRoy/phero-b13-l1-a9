import { Request, Response } from "express";
import * as TutorRepo from "../models/tutor.repository";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/AppError";

const VALID_TEACHING_MODES = ["Online", "Offline", "Both"] as const;

export const getTutors = async (req: Request, res: Response): Promise<void> => {
  const { search, startDate, endDate, createdBy, limit, page, all } = req.query;

  const { tutors, total, page: currentPage, limit: currentLimit } = await TutorRepo.findTutors({
    search:     search as string | undefined,
    startDate:  startDate as string | undefined,
    endDate:    endDate as string | undefined,
    createdBy:  createdBy as string | undefined,
    // When `all=true` pass null so the repo skips LIMIT/OFFSET entirely
    limit:      all ? null : limit ? parseInt(limit as string, 10) : 20,
    page:       page ? parseInt(page as string, 10) : 1,
  });

  sendResponse(res, 200, "Tutors fetched successfully", { tutors }, {
    total,
    page: currentPage,
    limit: currentLimit,
  });
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

  if (!VALID_TEACHING_MODES.includes(teachingMode)) {
    throw new BadRequestError(`teachingMode must be one of: ${VALID_TEACHING_MODES.join(", ")}`);
  }

  const fee = Number(hourlyFee);
  if (isNaN(fee) || fee < 0) {
    throw new BadRequestError("hourlyFee must be a non-negative number");
  }

  const slots = Number(totalSlot);
  if (!Number.isInteger(slots) || slots < 0) {
    throw new BadRequestError("totalSlot must be a non-negative integer");
  }

  if (!sessionStartDate || isNaN(Date.parse(sessionStartDate))) {
    throw new BadRequestError("sessionStartDate must be a valid date");
  }

  const tutor = await TutorRepo.createTutor({
    name,
    photo:               photo ?? "",
    subject,
    available_days:      availableDays ?? "",
    available_time:      availableTime ?? "",
    hourly_fee:          fee,
    total_slot:          slots,
    session_start_date:  new Date(sessionStartDate),
    institution:         institution ?? "",
    experience:          experience ?? "",
    location:            location ?? "",
    teaching_mode:       teachingMode,
    created_by:          (createdBy ?? req.user?.email ?? "").toLowerCase(),
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
    name:             "name",
    photo:            "photo",
    subject:          "subject",
    availableDays:    "available_days",
    availableTime:    "available_time",
    hourlyFee:        "hourly_fee",
    totalSlot:        "total_slot",
    sessionStartDate: "session_start_date",
    institution:      "institution",
    experience:       "experience",
    location:         "location",
    teachingMode:     "teaching_mode",
  };

  const updates: Partial<Omit<TutorRepo.Tutor, "id" | "created_by" | "created_at" | "updated_at">> = {};

  for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
    if (req.body[bodyKey] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updates as any)[dbKey] = req.body[bodyKey];
    }
  }

  if (updates.teaching_mode && !VALID_TEACHING_MODES.includes(updates.teaching_mode as never)) {
    throw new BadRequestError(`teachingMode must be one of: ${VALID_TEACHING_MODES.join(", ")}`);
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
