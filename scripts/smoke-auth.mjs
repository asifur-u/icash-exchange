/**
 * Terminal smoke: register → me → logout → bad login → login → profile → password → relogin → /account
 * Uses a unique X-Forwarded-For so prior rate-limit hits do not block the run.
 */
const base = process.env.SMOKE_BASE ?? "http://localhost:3000";
const stamp = Date.now();
const email = `smoke_${stamp}@icash.test`;
const password = "SmokePass123!";
const nextPassword = "SmokePass456!";
const ip = `198.51.100.${stamp % 250}`;

const cookieJar = new Map();

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const line of raw) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(step, path, { method = "GET", body } = {}) {
  const headers = {
    Origin: base,
    Referer: `${base}/auth`,
    "X-Forwarded-For": ip,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const cookie = cookieHeader();
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 120) };
  }
  const ok =
    step === "login_wrong"
      ? res.status === 401 || res.status === 429
      : res.status >= 200 && res.status < 300;
  console.log(
    `[${ok ? "PASS" : "FAIL"}] ${step} status=${res.status} ${JSON.stringify(json)?.slice(0, 180)}`,
  );
  return { ok, status: res.status, json, text };
}

const results = [];

results.push(
  await req("register", "/api/auth/register", {
    method: "POST",
    body: { name: "Smoke User", email, phone: "01711112222", password },
  }),
);
results.push(await req("me_after_register", "/api/auth/me"));
results.push(await req("logout", "/api/auth/logout", { method: "POST", body: {} }));
results.push(
  await req("login_wrong", "/api/auth/login", {
    method: "POST",
    body: { email, password: "WrongPass!!!" },
  }),
);
results.push(
  await req("login_ok", "/api/auth/login", {
    method: "POST",
    body: { email, password },
  }),
);
results.push(
  await req("profile", "/api/auth/profile", {
    method: "PATCH",
    body: { name: "Smoke Updated", phone: "01733334444" },
  }),
);
results.push(
  await req("password", "/api/auth/password", {
    method: "POST",
    body: { currentPassword: password, nextPassword },
  }),
);
results.push(await req("logout2", "/api/auth/logout", { method: "POST", body: {} }));
results.push(
  await req("login_new_password", "/api/auth/login", {
    method: "POST",
    body: { email, password: nextPassword },
  }),
);
const account = await req("account_page", "/account");
results.push({
  ...account,
  ok: account.status === 200 && account.text.includes("Hello"),
});
if (!results.at(-1).ok) {
  console.log(`[FAIL] account_page missing Hello (status=${account.status})`);
} else {
  console.log(`[PASS] account_page has Hello`);
}

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(`EMAIL=${email}`);
console.log(`IP=${ip}`);
console.log(failed.length ? `SMOKE_FAIL=${failed.length}` : "SMOKE_OK=true");
process.exit(failed.length ? 1 : 0);
