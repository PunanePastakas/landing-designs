# Waitlist backend (Supabase)

The landing-page form stores signups in a Supabase table. The browser inserts
rows directly using the **public anon key** — there is no server. Security comes
from Row Level Security, not from hiding the key.

## Which keys go where (read this first)

| Value | Sensitivity | Where it goes |
| ----- | ----------- | ------------- |
| **Project URL** (`https://<ref>.supabase.co`) | Public | `shared/redpen-config.js` (committed) |
| **anon / publishable key** | Public *by design* | `shared/redpen-config.js` (committed) |
| **service_role key** | 🔴 SECRET — full admin, bypasses RLS | **Never** in this repo, never in the browser, never shared in chat. Server-side only. |
| **Database password / connection string** | 🔴 SECRET | Never in this repo. |
| **Personal access token** (for the Supabase CLI) | 🔴 SECRET | Local machine / CI secret store only. |

Only the first two are needed for the form to work. The anon key is safe to ship
because the policy below lets `anon` **insert and nothing else** — it cannot read,
update, or delete. Reading the list is done by a trusted human in the dashboard
(or server-side with the service_role key).

## One-time setup

1. Create the project in the **EU region** (`eu-central`) for GDPR data residency.
2. Open **SQL Editor → New query**, paste all of [`waitlist.sql`](waitlist.sql), Run.
3. In **Settings → API**, copy the **Project URL** and the **anon public** key.
4. Paste both into `shared/redpen-config.js` (replace the `__PLACEHOLDER__`s).
5. Reload the page and submit a test signup → a row appears in **Table Editor →
   waitlist**.

## Verify the security is correct

In the live page's browser console:

```js
const c = supabase.createClient(REDPEN_CONFIG.SUPABASE_URL, REDPEN_CONFIG.SUPABASE_ANON_KEY);
await c.from('waitlist').insert({ email: 'check@example.com', consent: true }); // succeeds
await c.from('waitlist').select('*');                                           // returns []  ← reads blocked
```

If `select('*')` returns rows, the RLS policy is wrong — stop and re-run the SQL.

## Reading / exporting signups

- **Read:** Dashboard → Table Editor → `waitlist`.
- **Export:** Table Editor → Export to CSV (do this periodically — the Free plan
  keeps **no backups**).

## Keep the Free project awake

Free projects pause after **7 days of inactivity** (a dashboard login does *not*
count — only database/API traffic does). Set a free uptime pinger
(UptimeRobot / cron-job.org) to hit the REST endpoint every 2–3 days:

```
GET https://<ref>.supabase.co/rest/v1/waitlist?select=id&limit=1
Header:  apikey: <anon public key>
```

The request returns permission-denied (anon can't read) but the round-trip still
counts as activity and resets the pause timer.
