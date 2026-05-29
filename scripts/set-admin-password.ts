/**
 * Directly set a Supabase Auth user's password via admin API.
 * Bypasses email rate limits / SMTP entirely.
 *
 * Usage:
 *   npx tsx scripts/set-admin-password.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/set-admin-password.ts hanzaki0407@gmail.com MyNewPass123
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/set-admin-password.ts <email> <password>",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Look up user by email via admin listUsers (paginated)
  let userId: string | null = null;
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) {
      userId = found.id;
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  if (userId) {
    // Existing user → update password + force-confirm email
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`✅ Password updated for ${email} (id: ${userId})`);
  } else {
    // New user → create with password, pre-confirmed
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`✅ User created: ${email} (id: ${data.user?.id})`);
  }

  console.log(`Now sign in at /login with the password you provided.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
