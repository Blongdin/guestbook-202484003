import { deleteEntry, updateEntryMessage } from "@/lib/entries";
import { NOT_FOUND, outcomeError, readJson, serverError } from "@/lib/http";
import { parseId, validateDelete, validateUpdate } from "@/lib/validation";

type Ctx = RouteContext<"/api/entries/[id]">;

const notFound = () => Response.json({ error: NOT_FOUND }, { status: 404 });

export async function PATCH(request: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  const input = validateUpdate(await readJson(request));
  if (!input.ok) return Response.json({ error: input.error }, { status: 400 });
  try {
    const result = await updateEntryMessage(id, input.value.message, input.value.password);
    if (result.status !== "ok") return outcomeError(result.status);
    return Response.json(result.value);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (id === null) return notFound();
  const input = validateDelete(await readJson(request));
  if (!input.ok) return Response.json({ error: input.error }, { status: 400 });
  try {
    const result = await deleteEntry(id, input.value.password);
    if (result.status !== "ok") return outcomeError(result.status);
    return Response.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
