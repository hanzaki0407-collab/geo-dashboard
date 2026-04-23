import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Layout-level revalidation purges all nested pages and the unstable_cache
  // entries behind them (tags on data.ts all share the route tree).
  revalidatePath("/", "layout");

  return Response.json({ revalidated: true, now: Date.now() });
}
