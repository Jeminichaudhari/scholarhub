export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: any) {
  const { handlers } = await import("@/lib/auth");
  return handlers.GET(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const { handlers } = await import("@/lib/auth");
  return handlers.POST(req, ctx);
}
