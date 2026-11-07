import { afterEach, describe, expect, it } from "vitest";
import { adminRecipients, parseEmailList } from "@/lib/notify";

describe("admin notify inboxes", () => {
  const original = {
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL,
    ADMIN_NOTIFY_EMAILS: process.env.ADMIN_NOTIFY_EMAILS,
    SMTP_USER: process.env.SMTP_USER,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("splits comma, semicolon, and whitespace lists", () => {
    expect(parseEmailList("ops@example.com, backup@example.com")).toEqual([
      "ops@example.com",
      "backup@example.com",
    ]);
    expect(parseEmailList("ops@example.com; night@example.com\nalert@example.com")).toEqual([
      "ops@example.com",
      "night@example.com",
      "alert@example.com",
    ]);
  });

  it("dedupes and drops junk", () => {
    expect(parseEmailList("Ops@Example.com, ops@example.com, not-an-email, ")).toEqual(["ops@example.com"]);
    expect(parseEmailList("")).toEqual([]);
    expect(parseEmailList(undefined)).toEqual([]);
  });

  it("reads ADMIN_NOTIFY_EMAIL plus ADMIN_NOTIFY_EMAILS", () => {
    process.env.ADMIN_NOTIFY_EMAIL = "ops@example.com, desk@example.com";
    process.env.ADMIN_NOTIFY_EMAILS = "night@example.com";
    delete process.env.SMTP_USER;
    expect(adminRecipients()).toEqual(["ops@example.com", "desk@example.com", "night@example.com"]);
  });

  it("falls back to SMTP_USER only when no notify list is set", () => {
    delete process.env.ADMIN_NOTIFY_EMAIL;
    delete process.env.ADMIN_NOTIFY_EMAILS;
    process.env.SMTP_USER = "smtp@example.com";
    expect(adminRecipients()).toEqual(["smtp@example.com"]);
  });
});
