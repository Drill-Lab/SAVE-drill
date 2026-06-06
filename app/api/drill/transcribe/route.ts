import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Audio recording is required" }, { status: 400 });
  }

  const name = audio instanceof File && audio.name ? audio.name : "response.webm";

  const whisperForm = new FormData();
  whisperForm.append("file", audio, name);
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "en");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error(aborted ? "Whisper transcription timed out" : "Whisper transcription request failed", err);
    return NextResponse.json(
      { error: aborted ? "Transcription timed out. Please try again." : "Transcription failed. Please try again." },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const err = await res.text();
    console.error("Whisper transcription error", err);
    return NextResponse.json({ error: "Transcription failed. Try again or type your response." }, { status: 502 });
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ transcript: (data.text ?? "").trim() });
}
