# Bella Vista Dedicated Logistics LLC Driver Onboarding

This app now uses a secure, invite-only flow:

1. You open the admin portal.
2. You create a driver profile.
3. The app generates a unique onboarding URL for that specific driver.
4. You copy that URL and send it by email or text.
5. The driver can onboard only with that link, and only for their invited email.

## Pages

- `/` -> Welcome to Bella Vista page
- `/admin` -> Admin login and profile creation
- `/onboarding?invite=<token>` -> Driver onboarding form

## Tech Stack

- Next.js (App Router)
- Supabase (Postgres) for profiles, invites, and submissions metadata
- Local encrypted disk volume for uploaded document images
- Docker + Docker Compose for EC2 deployment

## Supabase Setup

1. Create a Supabase project.
2. In the SQL Editor, run [supabase/schema.sql](supabase/schema.sql).
3. Copy your `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

## Environment Variables

Copy `.env.example` to `.env` and set values:

- `PORT`: web server port (default `3000`)
- `UPLOAD_DIR`: upload storage path (default `./data/uploads`)
- `TRUST_PROXY`: set to `1` behind Nginx/ALB
- `MAX_UPLOAD_MB`: max image size per upload
- `APP_BASE_URL`: public app URL used in generated invite links
- `DEFAULT_INVITE_DAYS`: default invite expiry in days
- `ADMIN_EMAIL`: your admin login email
- `ADMIN_PASSWORD`: your admin login password
- `ADMIN_SESSION_SECRET`: long random secret for signing admin tokens
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `SUPABASE_SECRET_KEY`: Supabase secret key for server-side writes

## Run Locally

```bash
npm install
npm run dev
npm start
```

Open:

- http://localhost:3000

## Admin Workflow

1. Open `/admin`.
2. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Enter driver profile details.
4. Click Create Profile + Link.
5. Copy the generated onboarding URL and send it to that driver.

## Docker (EC2)

1. Provision EC2 Ubuntu 22.04.
2. Install Docker Engine + Docker Compose plugin.
3. Copy project to EC2 and create `.env`.
4. Start:

```bash
docker compose up -d --build
```

5. Put Nginx in front and expose only ports `80/443` publicly.
6. Enable TLS with Let's Encrypt.

## Security Notes

- Keep this app behind HTTPS only.
- Protect `.env` and never expose the service role key client-side.
- Never expose `SUPABASE_SECRET_KEY` client-side.
- Store uploads on encrypted EBS and restrict instance/IAM access.
- Set retention/deletion policies for SSN and license images.
- For scale, move documents to S3 + KMS and keep strict access controls.
