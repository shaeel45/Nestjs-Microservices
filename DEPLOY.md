# Deploying ShopForge for free

Three repos, three hosts, $0/month:

| Piece | Repo | Host | URL shape |
|---|---|---|---|
| API (monolith) | `shaeel45/Nestjs-Microservices` @ `monoliths` | Render (free web service) | `https://shopforge-api.onrender.com` |
| Storefront | `shaeel45/Shopforage-Ecommerce` @ `development` | Vercel (Hobby) | `https://shopforge-store.vercel.app` |
| Admin portal | `shaeel45/Shopforage-AdminPortal` @ `development` | Vercel (Hobby) | `https://shopforge-admin.vercel.app` |
| Database | — | Supabase (free) | already provisioned |

The API is deployed as **one Node process**. `apps/monolith` boots the HTTP
gateway on `$PORT` and all six TCP microservice listeners on `127.0.0.1:3001–3006`
inside the same process, so nothing else needs to be hosted.

---

## 1. Backend → Render

`render.yaml` in the repo root describes the service, so you don't have to type
build commands by hand.

1. Push the `monoliths` branch:
   ```powershell
   git push -u origin monoliths
   ```
2. Render Dashboard → **New → Blueprint** → select `Nestjs-Microservices` →
   branch `monoliths` → **Apply**.
3. Open the new `shopforge-api` service → **Environment** and paste the values
   for every variable marked `sync: false`:

   | Variable | Where it comes from |
   |---|---|
   | `JWT_ACCESS_SECRET` | your local `.env` |
   | `JWT_REFRESH_SECRET` | your local `.env` |
   | `JWT_REFRESH_EXPIRES_IN` | your local `.env` (e.g. `7d`) |
   | `USERS_DATABASE_URL` … `ORDERS_DATABASE_URL` | your local `.env` — **keep the `?schema=...` part** |
   | `STOREFRONT_ORIGIN` | fill in after step 3 below |
   | `ADMIN_PORTAL_ORIGIN` | fill in after step 3 below |

   `PORT` is injected by Render and read by `apps/monolith/src/main.ts`. Don't set it.

4. Wait for the build. `npm ci` runs the six `prisma generate` steps via
   `postinstall`; `build:deploy` applies pending migrations and compiles the
   monolith.

### What Render runs

```text
build: npm ci && npm run build:deploy
       └─ prisma migrate deploy ×6  →  nest build --config nest-cli.monolith.json
start: npm run start:prod:monolith
       └─ node dist/apps/monolith/apps/monolith/src/main.js
health: GET /settings/store   (200 + real Postgres query)
```

### Verify

```powershell
$api = 'https://shopforge-api.onrender.com'
curl.exe -s "$api/settings/store" | Out-String
curl.exe -s "$api/products?limit=1" | Out-String
curl.exe -s -o NUL -w "%{http_code}" "$api/users/me"        # expect 401
curl.exe -s -o NUL -w "%{http_code}" "$api/products/999999" # expect 404
```

### Free-tier realities

- **512 MB / 0.1 CPU.** The monolith peaked at ~206 MB locally and the heap is
  capped at 384 MB, so it fits. CPU is the tighter limit: first requests after a
  cold start are slow.
- **Sleeps after 15 min idle**, ~60 s cold start. Hit `/settings/store` once
  before demoing.
- **Ephemeral disk.** `uploads/` is wiped on every deploy/restart. Only the one
  image committed to git survives; anything uploaded through the admin portal
  disappears. See [Uploads](#uploads) to fix.
- **750 instance-hours/month** — one always-on service is 730, so a single
  service fits. A second free service would exceed the quota.

---

## 2. Database → already done

All six services share **one Supabase Postgres database** and differ only by
schema (`users_service`, `auth_service`, `products_service`, `inventory_service`,
`promocodes_service`, `orders_service`). Every `*_DATABASE_URL` is the same
host/user/password with a different `?schema=`.

Migration history exists and is current in all six schemas, so `migrate deploy`
is a no-op today and applies future migrations automatically.

> Use the **session-mode** pooler (port `5432`), not the transaction pooler
> (`6543`). Migrations need session semantics; the current URLs already use
> `5432`.

---

## 3. Frontends → Vercel (both)

Both apps are Vite SPAs using `BrowserRouter`, so each needs the SPA rewrite —
that is what `vercel.json` in each repo does.

For **each** of the two repos:

1. Vercel Dashboard → **Add New → Project** → import the repo.
2. Framework preset **Vite** (auto-detected). Leave build `npm run build`,
   output `dist` — `vercel.json` already pins them.
3. **Settings → Environment Variables** → add for *Production* (and Preview):
   ```text
   VITE_API_URL = https://shopforge-api.onrender.com
   ```
   No trailing slash. This is baked into the bundle, so changing it needs a redeploy.
4. Deploy.

Do it twice: once for `Shopforage-Ecommerce`, once for `Shopforage-AdminPortal`.

**Why both on Vercel?** Same zero-config flow, free Hobby tier, and separate
projects keep the two repos independent. Cloudflare Pages also works for the
admin portal (build `npm run build`, output `dist`, add a `public/_redirects`
with `/* /index.html 200`) if you want the admin UI on a different provider.

### Close the CORS loop

After both Vercel URLs exist, set on Render and redeploy:

```text
STOREFRONT_ORIGIN    = https://<storefront>.vercel.app
ADMIN_PORTAL_ORIGIN  = https://<admin>.vercel.app
```

(The current CORS callback is permissive, so the apps work without this — but
set it so the allow-list is real.)

---

## 4. Make yourself an admin

Registration always creates `CUSTOMER`. Promote the account in Supabase
(SQL editor):

```sql
UPDATE users_service.ecommerce_users
   SET role = 'ADMIN'
 WHERE email = 'you@example.com';
```

Log out and back in so the JWT picks up the new role.

---

## 5. Uploads

Product images are written to local disk by the gateway (`diskStorage` in
`apps/api-gateway/src/products/products.controller.ts`) and served from
`/uploads`. On Render that directory is ephemeral.

Options, cheapest first:

1. **Accept it** — read-only demo. Only the git-committed image persists.
2. **Supabase Storage** (free 1 GB, already in your stack) — swap `diskStorage`
   for a Supabase upload and store the public URL in `imageURL`. Best fit.
3. **Cloudinary** free tier — same idea, different SDK.

Whichever you pick, it's a change to the upload controller + `api.js` image URL
builder, not to the deploy setup.

---

## 6. Redeploying

- Backend: push to `monoliths` → Render rebuilds and runs migrations.
- Frontends: push to `development` → Vercel rebuilds.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails on `prisma migrate deploy` | A URL is missing its `?schema=` param, or uses port 6543 | Paste the full URL from `.env`, port `5432` |
| Deploy succeeds, all requests 500 | Env vars not set before first boot | Add them, then **Manual Deploy → Clear build cache & deploy** |
| Frontend calls `localhost:3000` | `VITE_API_URL` missing at build time | Add the env var, redeploy (it is inlined) |
| 401 on every authenticated call | Token signed with a different `JWT_ACCESS_SECRET` | Use the same secret the API runs with |
| Images 404 after a deploy | Ephemeral disk | See [Uploads](#uploads) |
| First request takes ~60 s | Free instance was asleep | Expected; warm it before demoing |
