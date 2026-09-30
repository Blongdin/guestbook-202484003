import { sql } from "./db";
import { hashPassword, verifyPassword } from "./password";

export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Outcome<T> = { status: "ok"; value: T } | { status: "not_found" } | { status: "wrong_password" };

type Row = {
  id: number;
  name: string;
  message: string;
  created_at: Date | string;
  updated_at: Date | string | null;
};

function toEntry(row: Row): Entry {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at === null ? null : new Date(row.updated_at).toISOString(),
  };
}

export async function listEntries(): Promise<Entry[]> {
  const rows = (await sql`
    SELECT id, name, message, created_at, updated_at
    FROM entries
    ORDER BY created_at DESC, id DESC
  `) as Row[];
  return rows.map(toEntry);
}

export async function createEntry(input: { name: string; message: string; password: string }): Promise<Entry> {
  const passwordHash = await hashPassword(input.password);
  const [row] = (await sql`
    INSERT INTO entries (name, message, password_hash)
    VALUES (${input.name}, ${input.message}, ${passwordHash})
    RETURNING id, name, message, created_at, updated_at
  `) as Row[];
  return toEntry(row);
}

// Loads the stored hash for id and checks the Entry Password before any change.
async function authorize(id: number, password: string): Promise<"ok" | "not_found" | "wrong_password"> {
  const [row] = (await sql`SELECT password_hash FROM entries WHERE id = ${id}`) as { password_hash: string }[];
  if (!row) return "not_found";
  return (await verifyPassword(password, row.password_hash)) ? "ok" : "wrong_password";
}

export async function updateEntryMessage(id: number, message: string, password: string): Promise<Outcome<Entry>> {
  const auth = await authorize(id, password);
  if (auth !== "ok") return { status: auth };
  const [row] = (await sql`
    UPDATE entries SET message = ${message}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, message, created_at, updated_at
  `) as Row[];
  return row ? { status: "ok", value: toEntry(row) } : { status: "not_found" };
}

export async function deleteEntry(id: number, password: string): Promise<Outcome<null>> {
  const auth = await authorize(id, password);
  if (auth !== "ok") return { status: auth };
  const rows = await sql`DELETE FROM entries WHERE id = ${id} RETURNING id`;
  return rows.length === 0 ? { status: "not_found" } : { status: "ok", value: null };
}
