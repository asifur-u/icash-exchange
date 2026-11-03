#!/usr/bin/env bash
# Merge an overlay env into /opt/icash-exchange/.env without touching DB/Redis passwords.
# Usage: bash deploy/merge-overlay.sh /tmp/vps.overlay.env
set -euo pipefail
cd "$(dirname "$0")/.."
OVERLAY="${1:?overlay file}"
ENV_FILE="${2:-.env}"

KEEP='^(POSTGRES_PASSWORD|REDIS_PASSWORD|DATABASE_URL|DATABASE_URL_UNPOOLED|REDIS_URL|AUTH_SECRET|CODE_ENCRYPTION_KEY)='

python3 - "$OVERLAY" "$ENV_FILE" "$KEEP" <<'PY'
import re, sys
from pathlib import Path

overlay, env_path, keep_re = sys.argv[1], Path(sys.argv[2]), re.compile(sys.argv[3])
def parse(text):
    out = {}
    order = []
    for line in text.splitlines():
        raw = line.rstrip("\n")
        if not raw.strip() or raw.lstrip().startswith("#") or "=" not in raw:
            order.append(("keep", raw))
            continue
        k, v = raw.split("=", 1)
        if k in out:
            order.append(("skip", raw))
            continue
        out[k] = v
        order.append(("kv", k))
    return out, order

old = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
cur, order = parse(old)
new, _ = parse(Path(overlay).read_text(encoding="utf-8"))
for k, v in new.items():
    if keep_re.match(k + "="):
        continue
    if k in cur:
        cur[k] = v
    else:
        cur[k] = v
        order.append(("kv", k))
lines = []
seen = set()
for kind, val in order:
    if kind == "keep":
        lines.append(val)
    elif kind == "kv":
        if val in seen:
            continue
        seen.add(val)
        lines.append(f"{val}={cur[val]}")
env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("merged", len(new), "overlay keys into", env_path)
PY
