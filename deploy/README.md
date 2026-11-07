# Run iCash Exchange on a VPS

One Linux VPS (Ubuntu 22.04+), Docker, and a domain. The public IP is fixed, so iCash can whitelist it.

## 1. Point DNS

Create an A record:

```
icash.exchange     →  YOUR_VPS_IP
www.icash.exchange →  YOUR_VPS_IP
```

Open ports **80** and **443**.

## 2. Install on the server

```bash
sudo apt-get update
sudo apt-get install -y git ca-certificates curl
git clone YOUR_REPO_URL icash-agent
cd icash-agent
```

Copy secrets into `.env`. Easiest: copy `.env.example` then paste the real values from your machine (`DATABASE_URL`, iCash keys, SMTP, deposit numbers). Do not commit `.env`.

```bash
cp .env.example .env
nano .env
```

Fill iCash keys, SMTP, deposit numbers, and `ADMIN_NOTIFY_EMAIL` in `.env`. Comma-separate multiple inboxes so every new order emails all of them. Leave database/redis blank — the setup script creates **Postgres + Redis on this VPS** and writes the URLs.

```bash
sudo bash deploy/vps-setup.sh your-domain.com you@email.com
```

That installs Docker if needed, generates `AUTH_SECRET`, `CODE_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and starts:

- `db` — Postgres 16 (not published to the internet)
- `redis` — Redis 7 with a password (rate limits)
- `app` — Next.js
- `nginx` — HTTP/HTTPS reverse proxy
- `certbot` — Let's Encrypt certificates

## 3. Bring old Neon users over (optional)

If users still live on Neon and you want them on this VPS:

```bash
# on a machine that can reach Neon
pg_dump --no-owner --no-acl "$NEON_UNPOOLED_URL" > desk.sql

# on the VPS, after compose is up
docker compose exec -T db psql -U icash -d icash < desk.sql
```

## 4. iCash IP whitelist

```bash
curl -4 https://api.ipify.org
```

Add that exact IP in the iCash reseller dashboard (no CIDR). Then set `ICASH_ENV=production` when you are ready.

## 5. Day-to-day

```bash
docker compose logs -f app
docker compose ps
docker compose pull && docker compose up -d --build
docker compose down
```

Screenshots stay in the `app_data` volume (`VAULTA_DATA_DIR=/data`). ImageKit is optional on a VPS.

## HTTPS (nginx + Let's Encrypt)

Point `icash.exchange` and `www.icash.exchange` at the VPS IP, then:

```bash
cd /opt/icash-exchange
# in .env:
#   DOMAIN=icash.exchange
#   NEXT_PUBLIC_SITE_URL=https://icash.exchange
#   ACME_EMAIL=you@email.com
docker compose up -d --remove-orphans
bash deploy/issue-cert.sh
```

## First owner

Open `https://your-domain.com/admin`. If no owner exists yet, that page creates one. If you already imported users, sign in with the owner email.

## CI/CD (GitHub Actions)

Push to `main` runs tests, then SSHs into this VPS and rebuilds Docker.

On the VPS, once, make a deploy key GitHub can use:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/gha_deploy -N ""
cat ~/.ssh/gha_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gha_deploy
```

GitHub → repo → **Settings → Secrets and variables → Actions**. Add:

| Secret | Value |
|---|---|
| `VPS_HOST` | VPS public IP |
| `VPS_USER` | `root` or `ubuntu` |
| `VPS_SSH_KEY` | full private key from `cat ~/.ssh/gha_deploy` |
| `VPS_DIR` | folder of the clone, e.g. `/root/icash-exchange` |

Optional: `VPS_PORT` if SSH is not 22.

The VPS git remote must be able to `git pull` (`main`). For a private repo, add a GitHub deploy key on the server.
