import { NextResponse } from "next/server";
import { getProgressData } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const progress = await getProgressData();
  return NextResponse.json(progress);
}
