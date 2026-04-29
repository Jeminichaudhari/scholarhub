export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";

async function getHandlers() {
  const { handlers } = await import("@/lib/auth");
  return handlers;
}

export async function GET(req: NextRequest, ctx: any) {
  const { GET: handler } = await getHandlers();
  return handler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const { POST: handler } = await getHandlers();
  return handler(req, ctx);
}
