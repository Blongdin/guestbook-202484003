// CRUD smoke test against a running server.
// Usage: npm run smoke            (http://localhost:3000)
//        SMOKE_URL=https://... npm run smoke
const BASE = (process.env.SMOKE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PASSWORD = "smoke-pass";

let failed = false;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failed = true;
    console.log(`  FAIL ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
  return condition;
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const hasHash = (value) =>
  [value].flat().some((entry) => entry && Object.keys(entry).some((key) => /password/i.test(key)));

console.log(`smoke: ${BASE}`);

// Every Entry this run creates, so the finally block can remove it even after a failure.
const createdIds = new Set();
async function post(body) {
  const res = await call("POST", "/api/entries", body);
  if (Number.isInteger(res.json?.id)) createdIds.add(res.json.id);
  return res;
}

let id;
try {
  // 1. empty name is rejected
  const bad = await post({ name: "   ", message: "hi", password: PASSWORD });
  check("1. POST empty name -> 400", bad.status === 400 && typeof bad.json?.error === "string", bad);

  // 2. create
  const created = await post({
    name: "smoke",
    message: `smoke test ${new Date().toISOString()}`,
    password: PASSWORD,
  });
  check("2. POST valid -> 201", created.status === 201 && Number.isInteger(created.json?.id), created);
  check("2. POST response has no password", !hasHash(created.json), created.json);
  id = created.json?.id;

  // 3. list shows it first
  const list = await call("GET", "/api/entries");
  check("3. GET -> 200 array", list.status === 200 && Array.isArray(list.json), list.status);
  check("3. new entry is first", list.json?.[0]?.id === id, list.json?.[0]);
  check("3. list has no password", !hasHash(list.json));

  // 4. wrong password cannot update
  const original = created.json?.message;
  const wrongPatch = await call("PATCH", `/api/entries/${id}`, { message: "hacked", password: "wrong-pass" });
  check("4. PATCH wrong password -> 403", wrongPatch.status === 403 && typeof wrongPatch.json?.error === "string", wrongPatch);
  const unchanged = await call("GET", "/api/entries");
  check("4. message unchanged", unchanged.json?.find?.((e) => e.id === id)?.message === original);

  // 5. right password updates the message
  const patch = await call("PATCH", `/api/entries/${id}`, { message: "  smoke edited  ", password: PASSWORD });
  check(
    "5. PATCH right password -> 200",
    patch.status === 200 && patch.json?.message === "smoke edited" && patch.json?.updatedAt !== null,
    patch,
  );
  check("5. PATCH response has no password", !hasHash(patch.json), patch.json);
  check("5. writtenAt unchanged", patch.json?.writtenAt !== undefined && patch.json?.writtenAt === created.json?.writtenAt, patch.json);
  const emptyPatch = await call("PATCH", `/api/entries/${id}`, { message: "   ", password: PASSWORD });
  check("5. PATCH empty message -> 400", emptyPatch.status === 400, emptyPatch);
  const shortPatch = await call("PATCH", `/api/entries/${id}`, { message: "short", password: "abc" });
  check("5. PATCH 3-char password -> 400", shortPatch.status === 400 && typeof shortPatch.json?.error === "string", shortPatch);

  // 6. wrong password cannot delete
  const wrongDelete = await call("DELETE", `/api/entries/${id}`, { password: "wrong-pass" });
  check("6. DELETE wrong password -> 403", wrongDelete.status === 403 && typeof wrongDelete.json?.error === "string", wrongDelete);
  const stillThere = await call("GET", "/api/entries");
  check("6. entry still exists", stillThere.json?.some?.((e) => e.id === id));

  // 7. right password deletes
  const del = await call("DELETE", `/api/entries/${id}`, { password: PASSWORD });
  if (check("7. DELETE right password -> 200", del.status === 200 && del.json?.ok === true, del)) createdIds.delete(id);

  // 8. entry is gone
  const after = await call("GET", "/api/entries");
  check("8. entry gone from list", Array.isArray(after.json) && !after.json.some((e) => e.id === id));
  const again = await call("DELETE", `/api/entries/${id}`, { password: PASSWORD });
  check("8. DELETE again -> 404", again.status === 404, again);
} catch (err) {
  check("smoke ran without throwing", false, String(err));
} finally {
  // Local and production share one DB: always try to remove what this run created.
  for (const leftover of createdIds) {
    const res = await call("DELETE", `/api/entries/${leftover}`, { password: PASSWORD }).catch(() => null);
    console.log(`  cleanup entry ${leftover} -> ${res?.status ?? "error"}`);
  }
}

console.log(failed ? "smoke FAILED" : "smoke passed");
process.exit(failed ? 1 : 0);
