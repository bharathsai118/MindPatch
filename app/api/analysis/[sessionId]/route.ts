import { NextResponse } from "next/server";
import {
  getAnalysisById,
  updateAnalysisFeedback
} from "@/lib/storage/json-store";
import type { AnalysisFeedbackValue } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const analysis = await getAnalysisById(sessionId);

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json(analysis);
}

function isFeedbackValue(value: unknown): value is AnalysisFeedbackValue {
  return value === "like" || value === "dislike" || value === null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { feedback?: unknown }
    | null;

  if (!body || !("feedback" in body) || !isFeedbackValue(body.feedback)) {
    return NextResponse.json(
      { error: "Invalid feedback. Use like, dislike, or null." },
      { status: 400 }
    );
  }

  const updatedAnalysis = await updateAnalysisFeedback(sessionId, body.feedback);

  if (!updatedAnalysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json(updatedAnalysis);
}
