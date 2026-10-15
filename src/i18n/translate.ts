import { messages, type MessageTree } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";

type LeafPaths<T, P extends string = ""> = T extends string
  ? P
  : {
      [K in keyof T & string]: LeafPaths<T[K], P extends "" ? K : `${P}.${K}`>;
    }[keyof T & string];

export type MessageKey = LeafPaths<MessageTree>;

function getPath(tree: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = tree;
  for (const part of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
) {
  const raw = getPath(messages[locale], key) ?? getPath(messages.en, key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined || vars[name] === null ? `{${name}}` : String(vars[name]),
  );
}
