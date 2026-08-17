# Inactive account retention

WHR Army Builder development policy:

- Account activity is refreshed when an authenticated user actively visits/signs in.
- After 18 months without activity, the account becomes eligible for an inactivity warning.
- A successful warning email schedules deletion for 30 days later.
- Signing in during those 30 days clears the warning/deletion timestamps.
- When the scheduled date arrives, the server-side worker deletes the Supabase Auth user. Foreign-key cascades remove the profile and saved armies.
- The retention worker fails closed: if an inactivity warning cannot be delivered, it does not start the deletion countdown.

## Database

Run, in order:

1. `001_army_lists.sql`
2. `002_profiles_privacy.sql`
3. `003_account_retention.sql`

The third migration adds `last_active_at`, `deletion_warning_sent_at`, and `scheduled_deletion_at`, plus the authenticated `mark_current_user_active()` RPC and service-only retention candidate views.

## Scheduled worker

`functions/account-retention/index.ts` is designed as a daily Supabase Edge Function. It requires these secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RETENTION_FROM_EMAIL`
- `SITE_URL` (optional; defaults to the current development site)

Do not expose the service-role key in browser JavaScript or GitHub Pages.

Once transactional email is configured, deploy the Edge Function and schedule it to run once per day using Supabase's scheduled Edge Function/cron facilities. Until email delivery is configured, leave the function unscheduled: the application will still record inactivity correctly, but no user will be automatically placed on a deletion countdown without a warning email.
