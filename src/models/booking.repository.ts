import { query } from "../db/pool";
import { Booking } from "../types";



export const createBooking = async (data: {
  tutor_id: string;
  tutor_name: string;
  student_name: string;
  student_email: string;
  phone: string;
}): Promise<Booking> => {
  const { rows } = await query<Booking>(
    `INSERT INTO bookings
      (tutor_id, tutor_name, student_name, student_email, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.tutor_id,
      data.tutor_name,
      data.student_name,
      data.student_email.toLowerCase(),
      data.phone,
    ]
  );
  return rows[0];
};

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
