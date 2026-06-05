import { query } from "../db/pool";
import { TutorFilters } from "../types";


export interface Tutor {
  id: string;
  name: string;
  photo: string;
  subject: string;
  available_days: string;
  available_time: string;
  hourly_fee: number;
  total_slot: number;
  session_start_date: Date;
  institution: string;
  experience: string;
  location: string;
  teaching_mode: "Online" | "Offline" | "Both";
  created_by: string;
  created_at: Date;
  updated_at: Date;
}


export const findTutors = async (
  filters: TutorFilters
): Promise<{ tutors: Tutor[]; total: number }> => {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.search) {
    conditions.push(`name ILIKE $${i++}`);
    params.push(`%${filters.search}%`);
  }

  if (filters.startDate) {
    conditions.push(`session_start_date >= $${i++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`session_start_date <= $${i++}`);
    params.push(filters.endDate);
  }

  if (filters.createdBy) {
    conditions.push(`created_by = $${i++}`);
    params.push(filters.createdBy.toLowerCase());
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM tutors ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const limit = filters.limit ?? 20;
  const page = filters.page ?? 1;
  const offset = (page - 1) * limit;

  const dataParams = [...params, limit, offset];

  const { rows } = await query<Tutor>(
    `SELECT * FROM tutors ${where}
     ORDER BY created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    dataParams
  );

  return { tutors: rows, total };
};

export const findTutorById = async (id: string): Promise<Tutor | null> => {
  const { rows } = await query<Tutor>(
    "SELECT * FROM tutors WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
};

export const createTutor = async (data: Omit<Tutor, "id" | "created_at" | "updated_at">): Promise<Tutor> => {
  const { rows } = await query<Tutor>(
    `INSERT INTO tutors
      (name, photo, subject, available_days, available_time, hourly_fee,
       total_slot, session_start_date, institution, experience, location,
       teaching_mode, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      data.name, data.photo, data.subject, data.available_days,
      data.available_time, data.hourly_fee, data.total_slot,
      data.session_start_date, data.institution, data.experience,
      data.location, data.teaching_mode, data.created_by.toLowerCase(),
    ]
  );
  return rows[0];
};

export const updateTutor = async (
  id: string,
  data: Partial<Omit<Tutor, "id" | "created_by" | "created_at" | "updated_at">>
): Promise<Tutor | null> => {
  const fields = Object.keys(data) as (keyof typeof data)[];
  if (fields.length === 0) return findTutorById(id);

  const setClauses = fields.map((f, idx) => `${f} = $${idx + 2}`).join(", ");
  const values = fields.map((f) => data[f]);

  const { rows } = await query<Tutor>(
    `UPDATE tutors SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ?? null;
};

export const deleteTutor = async (id: string): Promise<boolean> => {
  const { rowCount } = await query(
    "DELETE FROM tutors WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
};

export const decrementSlot = async (id: string): Promise<number> => {
  const { rows } = await query<{ total_slot: number }>(
    `UPDATE tutors SET total_slot = total_slot - 1
     WHERE id = $1 AND total_slot > 0
     RETURNING total_slot`,
    [id]
  );
  if (!rows[0]) throw new Error("No available slots or tutor not found");
  return rows[0].total_slot;
};
