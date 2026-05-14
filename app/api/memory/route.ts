import { NextResponse } from "next/server";
import { getMemories } from "@/lib/storage/json-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const memories = await getMemories();
  return NextResponse.json({ memories });
}
