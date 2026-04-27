import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("error", errorDescription);
    return NextResponse.redirect(redirect);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("error", error.message);
    return NextResponse.redirect(redirect);
  }

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
