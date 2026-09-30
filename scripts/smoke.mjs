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

// 1. empty name is rejected
const bad = await call("POST", "/api/entries", { name: "   ", message: "hi", password: PASSWORD });
check("1. POST empty name -> 400", bad.status === 400 && typeof bad.json?.error === "string", bad);

// 2. create
const created = await call("POST", "/api/entries", {
  name: "smoke",
  message: `smoke test ${new Date().toISOString()}`,
  password: PASSWORD,
});
check("2. POST valid -> 201", created.status === 201 && Number.isInteger(created.json?.id), created);
check("2. POST response has no password", !hasHash(created.json), created.json);
const id = created.json?.id;

// 3. list shows it first
const list = await call("GET", "/api/entries");
check("3. GET -> 200 array", list.status === 200 && Array.isArray(list.json), list.status);
check("3. new entry is first", list.json?.[0]?.id === id, list.json?.[0]);
check("3. list has no password", !hasHash(list.json));

console.log(failed ? "smoke FAILED" : "smoke passed");
process.exit(failed ? 1 : 0);
