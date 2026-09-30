import { createEntry, listEntries } from "@/lib/entries";
import { validateCreate } from "@/lib/validation";
import { readJson, serverError } from "@/lib/http";

export async function GET() {
  try {
    return Response.json(await listEntries());
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  const input = validateCreate(await readJson(request));
  if (!input.ok) return Response.json({ error: input.error }, { status: 400 });
  try {
    return Response.json(await createEntry(input.value), { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
