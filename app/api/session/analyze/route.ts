import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeReasoningSession } from "@/lib/agents/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const analyzeSchema = z.object({
  problem_name: z.string().min(1),
  problem_text: z.string().min(1),
  transcript: z.string().min(1),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  user_id: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyzeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid payload. Provide problem_name, problem_text, and transcript."
      },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeReasoningSession(parsed.data);
    return NextResponse.json(analysis);
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "Analysis failed during live agent execution."
      },
      { status: 502 }
    );
  }
}
