import { signUserSession } from "@/lib/auth";
import { cookieSecure } from "@/lib/http";

/** 7-day session — shorter than a month for safer desks. */
export const USER_SESSION_MAX_AGE = 7 * 24 * 60 * 60;

type CookieJar = {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      path?: string;
      maxAge?: number;
    },
  ) => void;
};

export function setUserSessionCookie(jar: CookieJar, userId: string) {
  jar.set("icash_user", signUserSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });
}

export function clearUserSessionCookie(jar: CookieJar) {
  jar.set("icash_user", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 0,
  });
}
