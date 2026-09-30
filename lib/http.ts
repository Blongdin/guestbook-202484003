export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function serverError(err: unknown) {
  console.error(err);
  return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 500 });
}
