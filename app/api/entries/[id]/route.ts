import { deleteEntry, updateEntryMessage } from "@/lib/entries";
import { outcomeError, readJson, serverError } from "@/lib/http";
import { parseId, validateDelete, validateUpdate } from "@/lib/validation";

type Ctx = RouteContext<"/api/entries/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (id === null) return outcomeError("not_found");
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
  if (id === null) return outcomeError("not_found");
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
