import { NextRequest, NextResponse } from "next/server";
import {auth} from "@/app/auth"
import { getGroq } from "@/app/lib/groq";

export const runtime = "nodejs"; 

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file required" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ text: "" });
  }

  try {
    const groq = getGroq();
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text ?? "" });
  } catch (err) {
    console.error("[transcribe] Groq request failed:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 502 },
    );
  }
}