import { Response } from "express";
import { getPool } from "../db/pool";
import * as BookingRepo from "../models/booking.repository";
import * as TutorRepo from "../models/tutor.repository";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/AppError";

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tutorId, tutorName, studentName, studentEmail, phone } = req.body;

  if (!tutorId || !phone) throw new BadRequestError("Tutor ID and phone are required");

  const tutor = await TutorRepo.findTutorById(tutorId);
  if (!tutor) throw new NotFoundError("Tutor not found");

  if (tutor.total_slot <= 0) {
    throw new BadRequestError("No available slots left for this tutor");
  }

  const now = new Date();
  if (now < new Date(tutor.session_start_date)) {
    const formatted = new Date(tutor.session_start_date).toLocaleDateString("en-BD", {
      day: "2-digit", month: "short", year: "numeric",
    });
    throw new BadRequestError(`Booking not available yet. Session starts on ${formatted}`);
  }

  // Check for duplicate booking by the same student
  const existingBookings = await BookingRepo.findBookingsByEmail(
    (studentEmail ?? req.user?.email ?? "").toLowerCase()
  );
  const alreadyBooked = existingBookings.some(
    (b) => b.tutor_id === tutorId && b.status === "pending"
  );
  if (alreadyBooked) {
    throw new BadRequestError("You already have an active booking for this tutor");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Atomic slot decrement — prevents race conditions
    const slotResult = await client.query<{ total_slot: number }>(
      `UPDATE tutors SET total_slot = total_slot - 1
       WHERE id = $1 AND total_slot > 0
       RETURNING total_slot`,
      [tutorId]
    );

    if ((slotResult.rowCount ?? 0) === 0) {
      throw new BadRequestError("No available slots left (concurrent booking)");
    }

    const { rows } = await client.query(
      `INSERT INTO bookings (tutor_id, tutor_name, student_name, student_email, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        tutorId,
        tutorName ?? tutor.name,
        studentName ?? req.user?.name,
        (studentEmail ?? req.user?.email ?? "").toLowerCase(),
        phone,
      ]
    );

    await client.query("COMMIT");
    sendResponse(res, 201, "Session booked successfully", { booking: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const email = (req.query.email as string) ?? req.user?.email;
  if (!email) throw new BadRequestError("Email is required");

  if (email.toLowerCase() !== req.user?.email?.toLowerCase()) {
    throw new ForbiddenError("You can only view your own bookings");
  }

  const bookings = await BookingRepo.findBookingsByEmail(email);
  sendResponse(res, 200, "Bookings fetched successfully", { bookings });
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const booking = await BookingRepo.findBookingById(req.params.id);
  if (!booking) throw new NotFoundError("Booking not found");

  if (booking.student_email !== req.user?.email?.toLowerCase()) {
    throw new ForbiddenError("You can only cancel your own bookings");
  }

  if (booking.status === "cancelled") {
    throw new BadRequestError("Booking is already cancelled");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Cancel the booking
    const { rows } = await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    // Restore the slot so other students can book
    await client.query(
      `UPDATE tutors SET total_slot = total_slot + 1 WHERE id = $1`,
      [booking.tutor_id]
    );

    await client.query("COMMIT");
    sendResponse(res, 200, "Booking cancelled successfully", { booking: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  const booking = await BookingRepo.findBookingById(req.params.id);
  if (!booking) throw new NotFoundError("Booking not found");

  if (booking.student_email !== req.user?.email?.toLowerCase()) {
    throw new ForbiddenError("You can only view your own bookings");
  }

  sendResponse(res, 200, "Booking fetched successfully", { booking });
};
