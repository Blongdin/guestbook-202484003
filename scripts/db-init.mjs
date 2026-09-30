// Applies db/schema.sql to DATABASE_URL. Safe to run repeatedly.
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (expected in .env.local)");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await sql.query(schema);
console.log("db:init done: entries table is ready");
