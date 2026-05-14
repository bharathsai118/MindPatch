import { NextResponse } from "next/server";
import { analyzeReasoningSession } from "@/lib/agents/workflow";
import { DEMO_PROBLEM_TEXT } from "@/lib/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OmiPayload = {
  transcript?: string;
  text?: string;
  problem_name?: string;
  problem_text?: string;
  topic?: string;
  difficulty?: string;
  memory?: {
    transcript?: string;
    text?: string;
  };
  segments?: Array<{
    text?: string;
    transcript?: string;
  }>;
};

function extractTranscript(payload: OmiPayload): string {
  if (payload.transcript) return payload.transcript;
  if (payload.text) return payload.text;
  if (payload.memory?.transcript) return payload.memory.transcript;
  if (payload.memory?.text) return payload.memory.text;
  if (Array.isArray(payload.segments)) {
    return payload.segments
      .map((segment) => segment.transcript ?? segment.text ?? "")
      .join(" ")
      .trim();
  }
  return "";
}

export async function POST(request: Request) {
  const secret = process.env.OMI_WEBHOOK_SECRET;
  const providedSecret =
    request.headers.get("x-omi-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (secret && providedSecret !== secret) {
    return NextResponse.json({ error: "Invalid Omi webhook secret" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as OmiPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const transcript = extractTranscript(payload);
  if (!transcript) {
    return NextResponse.json(
      { error: "Omi payload did not include transcript text" },
      { status: 400 }
    );
  }

  const analysis = await analyzeReasoningSession({
    problem_name: payload.problem_name ?? "Omi Captured DSA Session",
    problem_text: payload.problem_text ?? DEMO_PROBLEM_TEXT,
    transcript,
    topic: payload.topic ?? "DSA reasoning",
    difficulty: payload.difficulty ?? "unknown",
    user_id: "demo_user"
  });

  return NextResponse.json({
    session_id: analysis.session_id,
    analysis
  });
}
