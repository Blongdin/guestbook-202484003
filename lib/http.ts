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

export const NOT_FOUND = "이미 삭제되었거나 존재하지 않는 방명록 글입니다.";
export const WRONG_PASSWORD = "비밀번호가 일치하지 않습니다.";

export function outcomeError(status: "not_found" | "wrong_password") {
  return status === "not_found"
    ? Response.json({ error: NOT_FOUND }, { status: 404 })
    : Response.json({ error: WRONG_PASSWORD }, { status: 403 });
}
