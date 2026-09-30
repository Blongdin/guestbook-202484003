import { deleteEntry } from "@/lib/entries";
import { NOT_FOUND, outcomeError, readJson, serverError } from "@/lib/http";
import { parseId, validateDelete } from "@/lib/validation";

export async function DELETE(request: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const id = parseId((await ctx.params).id);
  if (id === null) return Response.json({ error: NOT_FOUND }, { status: 404 });
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
