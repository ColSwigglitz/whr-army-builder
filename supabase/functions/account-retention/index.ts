// WHR Army Builder account retention worker.
// Intended to run once per day as a scheduled Supabase Edge Function.
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
// RETENTION_FROM_EMAIL. It deliberately fails closed: without email delivery,
// no account is placed on the deletion countdown.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("RETENTION_FROM_EMAIL");
const siteUrl = Deno.env.get("SITE_URL") || "https://colswigglitz.github.io/whr-army-builder-dev/";

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sendWarning(email: string, displayName: string, deletionDate: string) {
  if (!resendKey || !fromEmail) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Your WHR Army Builder account is due for deletion",
      html: `<p>Hello ${displayName || "there"},</p><p>You have not used your WHR Army Builder account for 18 months. To avoid keeping personal data that is no longer needed, your account and associated cloud data are scheduled for deletion on <strong>${new Date(deletionDate).toLocaleDateString("en-GB")}</strong>.</p><p>If you want to keep your account and armies, simply <a href="${siteUrl}">sign in to WHR Army Builder</a> before that date. Signing in cancels the pending deletion.</p><p>If you no longer need the account, you do not need to do anything.</p><p>WHR Army Builder</p>`,
    }),
  });
  return response.ok;
}

Deno.serve(async () => {
  const summary = { warned: 0, deleted: 0, skipped: 0, errors: [] as string[] };

  // 1. Warn accounts inactive for 18 months. Only begin the countdown after a
  // warning has actually been delivered.
  const { data: warnings, error: warningQueryError } = await db
    .from("inactive_accounts_due_warning")
    .select("id,display_name,last_active_at");

  if (warningQueryError) summary.errors.push(`warning query: ${warningQueryError.message}`);

  for (const profile of warnings || []) {
    try {
      const { data, error } = await db.auth.admin.getUserById(profile.id);
      if (error || !data.user?.email) {
        summary.skipped++;
        continue;
      }

      const scheduledDeletion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const delivered = await sendWarning(data.user.email, profile.display_name, scheduledDeletion);
      if (!delivered) {
        summary.skipped++;
        continue;
      }

      const { error: updateError } = await db
        .from("profiles")
        .update({
          deletion_warning_sent_at: new Date().toISOString(),
          scheduled_deletion_at: scheduledDeletion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      summary.warned++;
    } catch (error) {
      summary.errors.push(`warn ${profile.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 2. Delete accounts whose 30-day warning period has elapsed. Deleting the
  // Auth user cascades to profiles and army_lists through their foreign keys.
  const { data: deletions, error: deletionQueryError } = await db
    .from("inactive_accounts_due_deletion")
    .select("id,scheduled_deletion_at");

  if (deletionQueryError) summary.errors.push(`deletion query: ${deletionQueryError.message}`);

  for (const profile of deletions || []) {
    try {
      const { error } = await db.auth.admin.deleteUser(profile.id);
      if (error) throw error;
      summary.deleted++;
    } catch (error) {
      summary.errors.push(`delete ${profile.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
