import type { IssuanceDelivery } from "@/lib/types";

const TEST_URL = "https://rb-stg.icash.one";
const PRODUCTION_URL = "https://rb.icash.one";
const TIMEOUT_MS = 15_000;
const TOKEN_EARLY_MS = 45_000;

export type IcashEnvironment = "test" | "production";

export type IcashCard = { currency: string; amount: number; code: string };

export type IcashIssue = {
  uuid?: string;
  totalAmount?: number;
  exchangeRate?: number;
  cards: IcashCard[];
};

export type IcashInfo = {
  uuid: string | null;
  ref: string | null;
  createdAt: string | null;
  cards: Array<IcashCard & { email?: string }>;
};

/** Error from the iCash API. `term` is the stable internal_term to branch on. */
export class IcashError extends Error {
  constructor(
    public term: string,
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "IcashError";
  }
}

const FRIENDLY: Record<string, string> = {
  reseller_not_enough_balance: "Your iCash reseller balance is too low. Top it up, then retry.",
  reseller_not_allowed: "iCash has not enabled this card currency (or this account) for API issuance.",
  operation_not_supported: "iCash refused this amount — it is over the volume allowed for your account.",
  reseller_action_is_off: "Voucher generation is switched off on the iCash account.",
  card_api_error: "iCash already has an order with this reference.",
  ip_error_status: "This server's IP is not on the iCash whitelist.",
  api_key_error_status: "The iCash API key or secret is wrong for this environment.",
  missing_authorization: "iCash did not receive the access token.",
  invalid_authorization_token_status: "iCash rejected the access token.",
  error_jwt_exception: "The iCash access token expired.",
  api_static_token_invalid: "The iCash static token is not valid.",
  api_static_token_expired: "The iCash static token was revoked or expired.",
  missing_parameter: "iCash says a required field is missing.",
  invalid_request: "iCash could not read the request.",
  timeout: "iCash did not answer in time.",
  network: "Could not reach iCash.",
  not_configured: "iCash is not connected. Add the reseller keys to the server environment.",
};

export function icashMessage(term: string) {
  return FRIENDLY[term] ?? "iCash returned an error.";
}

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function icashEnvironment(): IcashEnvironment {
  return env("ICASH_ENV") === "production" ? "production" : "test";
}

export function icashConfig() {
  const environment = icashEnvironment();
  const base = (env("ICASH_API_URL") ?? (environment === "production" ? PRODUCTION_URL : TEST_URL)).replace(
    /\/$/,
    "",
  );
  const staticToken = env("ICASH_STATIC_TOKEN");
  const key = env("ICASH_API_KEY");
  const secret = env("ICASH_API_SECRET");
  const delivery: IssuanceDelivery = env("ICASH_DELIVERY") === "desk" ? "desk" : "icash";
  return {
    environment,
    base,
    staticToken,
    key,
    secret,
    auth: staticToken ? ("static" as const) : key && secret ? ("keys" as const) : null,
    country: (env("ICASH_COUNTRY") ?? "BD").toUpperCase(),
    currency: (env("ICASH_CURRENCY") ?? "BDT").toUpperCase(),
    delivery,
    maxPerOrder: Number(env("ICASH_MAX_PER_ORDER") ?? 50_000),
    dailyCap: Number(env("ICASH_DAILY_CAP") ?? 500_000),
    lowBalance: Number(env("ICASH_LOW_BALANCE") ?? 0),
  };
}

export function icashConfigured() {
  const config = icashConfig();
  if (!config.auth) return false;
  return config.base.startsWith("https://");
}

/** Safe to show in the admin UI — no keys, no tokens. */
export function icashPublicConfig() {
  const config = icashConfig();
  return {
    connected: icashConfigured(),
    environment: config.environment,
    host: (() => {
      try {
        return new URL(config.base).host;
      } catch {
        return config.base;
      }
    })(),
    auth: config.auth,
    country: config.country,
    currency: config.currency,
    delivery: config.delivery,
    maxPerOrder: config.maxPerOrder,
    dailyCap: config.dailyCap,
  };
}

let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string> | null = null;

/** Clears the cached access token (tests, key rotation). */
export function resetIcashToken() {
  cached = null;
  pending = null;
}

type Raw = Record<string, unknown> & {
  status?: string;
  internal_term?: string;
  message?: string;
  data?: Record<string, unknown>;
};

async function send(url: string, init: RequestInit): Promise<{ status: number; body: Raw | null }> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    const name = (error as Error)?.name;
    const term = name === "TimeoutError" || name === "AbortError" ? "timeout" : "network";
    throw new IcashError(term, icashMessage(term));
  }
  const body = (await response.json().catch(() => null)) as Raw | null;
  return { status: response.status, body };
}

function fail(status: number, body: Raw | null): never {
  const term = typeof body?.internal_term === "string" && body.internal_term ? body.internal_term : `http_${status}`;
  throw new IcashError(term, icashMessage(term), status);
}

async function accessToken(force = false): Promise<string> {
  const config = icashConfig();
  if (config.auth === "static") return config.staticToken!;
  if (config.auth !== "keys") throw new IcashError("not_configured", icashMessage("not_configured"));
  if (!force && cached && cached.expiresAt > Date.now()) return cached.token;
  if (pending) return pending;

  pending = (async () => {
    const { status, body } = await send(`${config.base}/v1/resellers/funds/api-auth`, {
      method: "POST",
      body: JSON.stringify({ api_key: config.key, api_secret: config.secret }),
    });
    const token = body?.data?.access_token;
    if (status >= 400 || body?.status !== "success" || typeof token !== "string") fail(status, body);
    const ttl = Number(body?.data?.expires_in) || 360_000;
    cached = { token, expiresAt: Date.now() + Math.max(ttl - TOKEN_EARLY_MS, 30_000) };
    return token;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

async function call(method: "GET" | "POST", path: string, payload?: unknown, retried = false): Promise<Raw> {
  if (!icashConfigured()) throw new IcashError("not_configured", icashMessage("not_configured"));
  const config = icashConfig();
  const token = await accessToken();
  const { status, body } = await send(`${config.base}${path}`, {
    method,
    headers: { Authorization: `bearer ${token}` },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  if (status < 400 && body?.status === "success") return body;

  const term = body?.internal_term;
  const tokenProblem = term === "error_jwt_exception" || term === "invalid_authorization_token_status";
  if (tokenProblem && config.auth === "keys" && !retried) {
    cached = null;
    return call(method, path, payload, true);
  }
  fail(status, body);
}

function toNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toCards(value: unknown): Array<IcashCard & { email?: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((card: Record<string, unknown>) => ({
      currency: String(card?.currency ?? ""),
      amount: toNumber(card?.amount) ?? 0,
      code: String(card?.code ?? card?.voucher_code ?? ""),
      email: typeof card?.destination_email === "string" ? card.destination_email : undefined,
    }))
    .filter((card) => card.code);
}

/** Looks an order up by our reference. Unknown references come back with no cards. */
export async function icashInfo(ref: string): Promise<IcashInfo> {
  const body = await call(
    "GET",
    `/v1/resellers/funds/api/issuance/info?reseller_reference_order_id=${encodeURIComponent(ref)}`,
  );
  return {
    uuid: typeof body.uuid === "string" ? body.uuid : null,
    ref: typeof body.reseller_reference_order_id === "string" ? body.reseller_reference_order_id : null,
    createdAt: typeof body.creation_date === "string" ? body.creation_date : null,
    cards: toCards(body.issuances),
  };
}

/**
 * Generates one voucher. Safe to call again with the same `ref`: iCash rejects a reused
 * reference (card_api_error), and we then read the existing issuance instead of buying twice.
 */
export async function icashIssue(input: { ref: string; amount: number; email?: string }): Promise<IcashIssue> {
  const config = icashConfig();
  const payload: Record<string, unknown> = {
    country: config.country,
    card_currency: config.currency,
    card_amount: input.amount,
    quantity: 1,
    reseller_reference_order_id: input.ref,
  };
  if (config.delivery === "icash" && input.email) payload.destination_email = input.email;

  try {
    const body = await call("POST", "/v1/resellers/funds/api/issuance/create", payload);
    const cards = toCards(body.cards);
    if (cards.length === 0) throw new IcashError("empty_issue", "iCash answered without a voucher.");
    return {
      uuid: typeof body.uuid === "string" ? body.uuid : undefined,
      totalAmount: toNumber(body.total_amount),
      exchangeRate: toNumber(body.exchange_rate),
      cards,
    };
  } catch (error) {
    if (!(error instanceof IcashError) || error.term !== "card_api_error") throw error;
    const existing = await icashInfo(input.ref);
    if (existing.cards.length === 0) throw error;
    return { uuid: existing.uuid ?? undefined, cards: existing.cards };
  }
}

export async function icashBalance() {
  const body = await call("GET", "/v1/resellers/funds/api/balance");
  return {
    currency: typeof body.currency === "string" ? body.currency : "",
    balance: toNumber(body.balance) ?? 0,
  };
}
