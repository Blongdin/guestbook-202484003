const FIELDS = {
  name: { min: 1, max: 20, required: "이름을 입력해 주세요.", length: "이름은 1–20자로 입력해 주세요." },
  message: { min: 1, max: 500, required: "메시지를 입력해 주세요.", length: "메시지는 1–500자로 입력해 주세요." },
  password: { min: 4, max: 20, required: "비밀번호를 입력해 주세요.", length: "비밀번호는 4–20자로 입력해 주세요." },
} as const;

type Field = keyof typeof FIELDS;
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const LIMITS = FIELDS;

// Names and messages are stored trimmed; passwords are hashed exactly as typed.
function check(field: Field, value: unknown): Result<string> {
  const rule = FIELDS[field];
  if (typeof value !== "string" || value.trim().length === 0) return { ok: false, error: rule.required };
  const v = field === "password" ? value : value.trim();
  if (v.length < rule.min || v.length > rule.max) return { ok: false, error: rule.length };
  return { ok: true, value: v };
}

function fields(body: unknown): Record<string, unknown> {
  return body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

export function validateCreate(body: unknown): Result<{ name: string; message: string; password: string }> {
  const b = fields(body);
  const name = check("name", b.name);
  if (!name.ok) return name;
  const message = check("message", b.message);
  if (!message.ok) return message;
  const password = check("password", b.password);
  if (!password.ok) return password;
  return { ok: true, value: { name: name.value, message: message.value, password: password.value } };
}

export function validateDelete(body: unknown): Result<{ password: string }> {
  const password = fields(body).password;
  if (typeof password !== "string" || password.trim().length === 0) {
    return { ok: false, error: FIELDS.password.required };
  }
  return { ok: true, value: { password } };
}

// Route param -> positive integer id, or null (treated as "not found").
export function parseId(raw: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id <= 2147483647 ? id : null;
}
