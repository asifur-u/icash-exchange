# iCash Exchange

A digital voucher desk you can run immediately. Redis and a payment account are not required for the demonstration.

## Run it

1. Install Node.js 20.9 or newer.
2. Open a terminal in this folder.
3. `npm install`
4. `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)
6. Owner desk: [http://localhost:3000/admin](http://localhost:3000/admin)

The password is printed in the terminal and saved in `.data/admin-password.txt`. If you set `ADMIN_PASSWORD`, that value is used instead.

Choose a note, enter an email, then confirm the demonstration payment. No real money moves. The code appears on the order page. Delete the `.data` folder and run `npm run dev` again to reset the desk.

## What you are running

The storefront, checkout, code reservation, encryption, order page, and owner desk all run on this machine. Codes are encrypted before they touch `.data/store.json`. A code is reserved for one order, then sold once. Unpaid holds return to stock after 15 minutes.

Sample notes are not real value. Do not put a brand name or logo on the site until you have a written right to resell that voucher.

## Before a real sale

1. Register the domain for iCash Exchange.
2. Get supplier agreements, then replace the sample catalog.
3. Create a Neon Postgres database and set `DATABASE_URL` (pooled) plus `DATABASE_URL_UNPOOLED` (direct). Apply schema with `npm run db:deploy`.
4. Put a 32-byte base64 `CODE_ENCRYPTION_KEY` in the environment before the first real code is saved. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
5. Connect a payment gateway you hold a merchant account with. Set `PAYMENT_MODE=live`. Only a verified webhook marks an order paid.
6. Add Resend (`RESEND_API_KEY`, `DELIVERY_FROM`) and, if you want texts, an HTTPS `SMS_API_URL`.
7. On a VPS the app, Caddy, self-hosted Postgres, and Redis run with Docker Compose. Whitelist the VPS IP at iCash.
8. Finish the refund policy, terms, and privacy note with a lawyer before launch. Turn on database backups before the first real sale.

## VPS

Production is meant to run on a VPS with Docker, not serverless. Follow **[deploy/README.md](deploy/README.md)**. Short version:

```bash
sudo bash deploy/vps-setup.sh your-domain.com you@email.com
```

Copy `.env.example` to `.env.local` for local work. Until then, leave it alone and use `npm run dev`.
