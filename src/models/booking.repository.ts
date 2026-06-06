import { query } from "../db/pool";
import { Booking } from "../types";

export const findBookingsByEmail = async (email: string): Promise<Booking[]> => {
  const { rows } = await query<Booking>(
    `SELECT * FROM bookings
     WHERE student_email = $1
     ORDER BY booked_at DESC`,
    [email.toLowerCase()]
  );
  return rows;
};

export const findBookingById = async (id: string): Promise<Booking | null> => {
  const { rows } = await query<Booking>(
    "SELECT * FROM bookings WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
};

export const cancelBooking = async (id: string): Promise<Booking | null> => {
  const { rows } = await query<Booking>(
    `UPDATE bookings SET status = 'cancelled'
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
};
