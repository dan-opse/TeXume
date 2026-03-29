import { NextRequest, NextResponse } from "next/server";
import { getFlashModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const model = getFlashModel();
    const result = await model.generateContent("Say hello");
    return NextResponse.json({ ok: true, text: result.response.text() });
  } catch (err: any) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 });
  }
}
