import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeskError } from "@/lib/errors";
import { dataDir } from "@/lib/paths";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

type UserDb = {
  version: 1;
  users: User[];
};

let chain: Promise<void> = Promise.resolve();

function usersFile() {
  return path.join(dataDir(), "users.json");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (next.length !== expected.length) return false;
  return timingSafeEqual(next, expected);
}

async function readUsers(): Promise<UserDb> {
  try {
    const raw = await readFile(usersFile(), "utf8");
    const parsed = JSON.parse(raw) as UserDb;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users)) {
      throw new Error("User file damaged");
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { version: 1, users: [] };
  }
}

async function writeUsers(db: UserDb) {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(usersFile(), JSON.stringify(db, null, 2));
}

function withUsers<T>(fn: (db: UserDb) => T | Promise<T>) {
  const run = chain.then(async () => {
    const db = await readUsers();
    const result = await fn(db);
    await writeUsers(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

export async function registerUser(input: { name: string; email: string; phone: string; password: string }) {
  return withUsers((db) => {
    const email = input.email.trim().toLowerCase();
    if (db.users.some((user) => user.email === email)) {
      throw new DeskError("CONFLICT", "An account with this email already exists. Log in instead.");
    }
    const user: User = {
      id: `usr_${randomBytes(8).toString("hex")}`,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return publicUser(user);
  });
}

export async function authenticateUser(email: string, password: string) {
  const db = await readUsers();
  const user = db.users.find((item) => item.email === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new DeskError("UNAUTHORIZED", "Email or password is wrong.");
  }
  return publicUser(user);
}

export async function getUserById(id: string) {
  const db = await readUsers();
  const user = db.users.find((item) => item.id === id);
  return user ? publicUser(user) : null;
}

export function fingerprint(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}
