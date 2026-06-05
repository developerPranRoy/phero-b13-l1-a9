import { query } from "../db/pool";

export interface User {
  id: string;
  name: string;
  email: string;
  photo_url: string;
  password: string;
  provider: "email" | "google";
  created_at: Date;
  updated_at: Date;
}

export type PublicUser = Omit<User, "password">;


export const findByEmail = async (email: string): Promise<User | null> => {
  const { rows } = await query<User>(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
};

export const findById = async (id: string): Promise<PublicUser | null> => {
  const { rows } = await query<PublicUser>(
    "SELECT id, name, email, photo_url, provider, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  photo_url: string;
  password: string;         
  provider?: "email" | "google";
}): Promise<PublicUser> => {
  const { rows } = await query<PublicUser>(
    `INSERT INTO users (name, email, photo_url, password, provider)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, photo_url, provider, created_at, updated_at`,
    [
      data.name,
      data.email.toLowerCase(),
      data.photo_url,
      data.password,
      data.provider ?? "email",
    ]
  );
  return rows[0];
};
