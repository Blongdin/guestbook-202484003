import { sql } from "./db";
import { hashPassword } from "./password";

export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string | null;
};

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
