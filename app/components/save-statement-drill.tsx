"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  savePhases,
  SUCCESSES_PER_PHASE,
  type SaveCategory,
  type SavePhaseConfig,
} from "@/lib/save-drill-config";

type View =
  | "welcome"
  | "mic"
  | "phase_intro"
  | "prompt"
  | "feedback"
  | "phase_choice"
  | "done";

function pickRandomPromptIndex(length: number, avoid?: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * length);
  if (avoid !== undefined && length > 1) {
    let guard = 0;
    while (idx === avoid && guard < 10) {
      idx = Math.floor(Math.random() * length);
      guard++;
    }
  }
  return idx;
}

export function SaveStatementDrill() {
  const [view, setView] = useState<View>("welcome");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lastConsistent, setLastConsistent] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [introAudioError, setIntroAudioError] = useState(false);
  const [promptAudioError, setPromptAudioError] = useState(false);

  const introAudioRef = useRef<HTMLAudioElement>(null);
  const promptAudioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const phase: SavePhaseConfig | undefined = savePhases[phaseIndex];
  const category: SaveCategory | undefined = phase?.id;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const ensureMic = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return stream;
    } catch {
      setMicError("Microphone access is required for this drill. Check browser permissions and try again.");
      return null;
    }
  }, []);

  const runEvaluation = useCallback(async (text: string) => {
    if (!category || !text.trim()) return;
    setEvaluating(true);
    setFeedback("");
    try {
      const res = await fetch("/api/drill/save-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, transcript: text.trim() }),
      });
      const data = (await res.json()) as { consistent?: boolean; feedback?: string };
      setLastConsistent(Boolean(data.consistent));
      setFeedback(data.feedback ?? "");
    } catch {
      setLastConsistent(false);
      setFeedback("");
      setMicError("Could not reach the coach service. Check your connection and try again.");
    } finally {
      setEvaluating(false);
    }
  }, [category]);

  useEffect(() => {
    if (view !== "phase_intro") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      setView("prompt");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  useEffect(() => {
    if (view !== "phase_intro" || introAudioError || !phase) return;

    const el = introAudioRef.current;
    if (!el) return;

    const timer = window.setTimeout(() => {
      el.play().catch(() => {
        /* Autoplay may be blocked; learner can use the audio controls. */
      });
    }, 2000);

    return () => {
      window.clearTimeout(timer);
      el.pause();
      el.currentTime = 0;
    };
  }, [view, phaseIndex, phase, introAudioError]);

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") return;

    setMicError(null);
    setTranscript("");
    const stream = streamRef.current ?? (await ensureMic());
    if (!stream) return;

    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    try {
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mr.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mr;
      // Timeslice helps browsers flush audio chunks reliably before stop.
      mr.start(250);
      setRecording(true);
    } catch {
      setMicError("Recording failed to start. Try another browser or check permissions.");
    }
  }, [ensureMic]);

  useEffect(() => {
    if (view !== "prompt" || !phase) return;

    let started = false;
    let delayTimer: number | undefined;

    const tryAutoStart = () => {
      if (started) return;
      started = true;
      void startRecording();
    };

    const el = promptAudioRef.current;
    const hasWorkingAudio = Boolean(el?.src) && !promptAudioError;

    if (hasWorkingAudio && el) {
      void el.play().catch(() => setPromptAudioError(true));

      const onEnded = () => tryAutoStart();
      el.addEventListener("ended", onEnded);
      if (el.ended) {
        tryAutoStart();
      }

      return () => {
        el.removeEventListener("ended", onEnded);
        if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      };
    }

    delayTimer = window.setTimeout(tryAutoStart, 2500);
    return () => {
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
    };
  }, [view, phase, promptIdx, promptAudioError, startRecording]);

  const finishRecording = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setRecording(false);
      return;
    }

    setMicError(null);
    setTranscript("");
    setFeedback("");
    setLastConsistent(false);
    setTranscribing(true);
    setEvaluating(false);
    setView("feedback");

    const recordedMime = mr.mimeType || "audio/webm";

    try {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          mr.onstop = () => resolve();
          mr.onerror = () => reject(new Error("Recording failed to finalize."));
          if (mr.state === "recording") {
            mr.requestData();
          }
          mr.stop();
        }),
        new Promise<void>((_, reject) => {
          window.setTimeout(() => reject(new Error("Recording timed out.")), 8000);
        }),
      ]);
    } catch {
      mediaRecorderRef.current = null;
      setRecording(false);
      setMicError("Recording did not finish. Please try again.");
      setTranscribing(false);
      return;
    }

    mediaRecorderRef.current = null;
    setRecording(false);

    const blob = new Blob(audioChunksRef.current, { type: recordedMime });
    audioChunksRef.current = [];

    if (blob.size === 0) {
      setMicError("No audio was captured. Try recording again.");
      setTranscribing(false);
      return;
    }

    const extension = recordedMime.includes("mp4") ? "m4a" : "webm";
    const formData = new FormData();
    formData.append("audio", blob, `response.${extension}`);

    const controller = new AbortController();
    const fetchTimeout = window.setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch("/api/drill/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = (await res.json()) as { transcript?: string; error?: string };
      if (!res.ok) {
        setMicError(data.error ?? "Transcription failed. Please try again.");
        setTranscribing(false);
        return;
      }
      const text = data.transcript?.trim() ?? "";
      setTranscript(text);
      setTranscribing(false);
      if (!text) {
        setMicError("No speech detected. Please try again.");
        return;
      }
      await runEvaluation(text);
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "AbortError";
      setMicError(
        timedOut
          ? "Transcription is taking too long. Please try again."
          : "Could not reach transcription service. Please try again."
      );
      setTranscribing(false);
    } finally {
      window.clearTimeout(fetchTimeout);
    }
  };

  const resetForNextPrompt = (nextIdx: number) => {
    setPromptIdx(nextIdx);
    setTranscript("");
    setFeedback("");
    setPromptAudioError(false);
    setView("prompt");
  };

  const handleFeedbackContinue = () => {
    if (!phase) return;
    if (!lastConsistent) {
      setView("prompt");
      return;
    }
    const nextSuccess = successCount + 1;
    setSuccessCount(nextSuccess);
    if (nextSuccess >= SUCCESSES_PER_PHASE) {
      setView("phase_choice");
      return;
    }
    const nextPrompt = pickRandomPromptIndex(phase.textPrompts.length, promptIdx);
    resetForNextPrompt(nextPrompt);
  };

  const advanceToNextPhase = () => {
    if (phaseIndex >= savePhases.length - 1) {
      setView("done");
      return;
    }
    const nextIdx = phaseIndex + 1;
    const next = savePhases[nextIdx];
    setPhaseIndex(nextIdx);
    setSuccessCount(0);
    setIntroAudioError(false);
    setPromptAudioError(false);
    setTranscript("");
    setFeedback("");
    setPromptIdx(pickRandomPromptIndex(next.textPrompts.length));
    setView("phase_intro");
  };

  const continueSamePhase = () => {
    setSuccessCount(0);
    setTranscript("");
    setFeedback("");
    setPromptAudioError(false);
    setView("prompt");
    const p = phase;
    if (p) setPromptIdx(pickRandomPromptIndex(p.textPrompts.length));
  };

  if (!phase && view !== "done") {
    return null;
  }

  return (
    <div className="space-y-6">
      {view === "welcome" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Welcome to your practice session</h2>
          <p className="mt-3 text-slate-700">
            Let&apos;s do a quick orientation before we start.
          </p>
          <p className="mt-4 font-medium text-slate-900">Purpose</p>
          <p className="mt-1 text-slate-700">
            Practice brief empathic responses using <strong>SAVE</strong>:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
            <li>
              <strong>S — Support:</strong> &quot;Let&apos;s figure this out together.&quot;
            </li>
            <li>
              <strong>A — Acknowledge:</strong> &quot;That must have been incredibly hard to go
              through.&quot;
            </li>
            <li>
              <strong>V — Validate:</strong> &quot;It&apos;s natural to feel that way.&quot;
            </li>
            <li>
              <strong>E — Emotion naming:</strong> &quot;You seem sad.&quot;
            </li>
          </ul>
          <p className="mt-4 text-slate-700">
            You&apos;ll hear short patient statements. Respond out loud with{" "}
            <strong>one</strong> empathic statement at a time, matching the phase you&apos;re in.
          </p>
          <p className="mt-3 text-slate-700">
            We&apos;ll aim for at least three strong responses in each SAVE type. You need a working
            microphone and a quiet space.
          </p>
          <button
            type="button"
            onClick={() => {
              setPhaseIndex(0);
              setSuccessCount(0);
              setPromptIdx(pickRandomPromptIndex(savePhases[0].textPrompts.length));
              setView("mic");
            }}
            className="mt-6 rounded-lg bg-[var(--primary)] px-5 py-3 font-semibold text-white"
          >
            Continue to microphone check
          </button>
        </div>
      )}

      {view === "mic" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Microphone</h2>
          <p className="mt-2 text-slate-700">
            This drill records your spoken response automatically after each patient statement.
            We&apos;ll ask for microphone access before your first response.
          </p>
          {micError ? <p className="mt-3 text-sm text-red-600">{micError}</p> : null}
          <p className="mt-3 text-sm text-slate-600">
            Ensure <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code> is set in{" "}
            <code className="rounded bg-slate-100 px-1">.env.local</code>, then restart the dev
            server.
          </p>
          <button
            type="button"
            onClick={async () => {
              await ensureMic();
              setView("phase_intro");
            }}
            className="mt-6 rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white"
          >
            Ready to begin — start with Support
          </button>
        </div>
      )}

      {view === "phase_intro" && phase && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            Step {phaseIndex + 1}: {phase.label} ({phase.letter})
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{phase.meaning}</h2>
          <p className="mt-2 text-slate-600">{phase.example}</p>
          <div className="mt-4">
            {!introAudioError ? (
              <>
                <audio
                  ref={introAudioRef}
                  key={phase.introAudio}
                  src={phase.introAudio}
                  controls
                  className="w-full max-w-md"
                  onError={() => setIntroAudioError(true)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Introduction audio starts automatically after a short pause. If it doesn&apos;t
                  play, use the controls above.
                </p>
              </>
            ) : (
              <p className="text-slate-700">
                <strong>Intro (read aloud):</strong> In this section, practice{" "}
                <strong>{phase.label}</strong> responses. {phase.meaning}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setView("prompt")}
            className="mt-6 rounded-lg bg-[var(--primary)] px-5 py-3 font-semibold text-white"
          >
            I&apos;m ready
          </button>
          <p className="mt-2 text-xs text-slate-500">Tip: you can also press Space when this screen is focused.</p>
        </div>
      )}

      {view === "prompt" && phase && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">
              {phase.label} · Successes: {successCount}/{SUCCESSES_PER_PHASE}
            </p>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Patient statement</h3>
          {!promptAudioError ? (
            <audio
              ref={promptAudioRef}
              key={`${phase.id}-${promptIdx}`}
              src={phase.promptAudio[promptIdx] ?? ""}
              controls
              className="mt-3 w-full max-w-md"
              onError={() => setPromptAudioError(true)}
            />
          ) : null}
          {(promptAudioError || !phase.promptAudio[promptIdx]) && (
            <blockquote className="mt-4 border-l-4 border-[var(--primary)] bg-slate-50 py-3 pl-4 text-lg text-slate-800">
              {phase.textPrompts[promptIdx]}
            </blockquote>
          )}
          <p className="mt-4 text-sm text-slate-600">
            Respond out loud with one {phase.label.toLowerCase()} empathic statement.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {recording ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                  Recording — speak your response, then click I&apos;m done
                </p>
                <button
                  type="button"
                  onClick={finishRecording}
                  className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
                >
                  I&apos;m done
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                {promptAudioError || !phase.promptAudio[promptIdx]
                  ? "Read the statement above. Recording will start automatically in a moment…"
                  : "Listen to the patient statement. Recording will start automatically when it finishes."}
              </p>
            )}
            {!recording && micError ? (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
              >
                Start recording
              </button>
            ) : null}
          </div>
          {micError ? <p className="mt-2 text-sm text-red-600">{micError}</p> : null}
        </div>
      )}

      {view === "feedback" && phase && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {(transcribing || evaluating) && (
            <h3 className="text-lg font-semibold text-slate-700">Processing your response…</h3>
          )}

          <div className={`rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 ${transcribing || evaluating ? "mt-4" : ""}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your response
            </p>
            <p className="mt-2 text-slate-800">
              {transcribing
                ? "Transcribing your recording…"
                : transcript
                  ? `"${transcript}"`
                  : "—"}
            </p>
          </div>

          {!transcribing && !evaluating && micError ? (
            <h3 className="mt-4 text-lg font-semibold text-slate-700">Please try again</h3>
          ) : !transcribing && !evaluating && feedback ? (
            <h3
              className={`mt-4 text-lg font-semibold ${
                lastConsistent ? "text-[var(--primary)]" : "text-red-700"
              }`}
            >
              {lastConsistent ? "Nice work" : "Let's adjust"}
            </h3>
          ) : null}

          {evaluating ? (
            <p className="mt-4 text-slate-600">Getting feedback…</p>
          ) : feedback ? (
            <p className="mt-4 text-slate-800">{feedback}</p>
          ) : null}

          {micError ? <p className="mt-3 text-sm text-red-600">{micError}</p> : null}

          {!transcribing && !evaluating ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {!lastConsistent && !feedback && micError ? (
                <button
                  type="button"
                  onClick={() => {
                    setMicError(null);
                    setView("prompt");
                  }}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
                >
                  Try again
                </button>
              ) : !lastConsistent && feedback ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMicError(null);
                      setView("prompt");
                    }}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
                  >
                    Replay same statement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript("");
                      setFeedback("");
                      setMicError(null);
                      setPromptIdx(pickRandomPromptIndex(phase.textPrompts.length, promptIdx));
                      setView("prompt");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                  >
                    Next Statement
                  </button>
                </>
              ) : successCount + 1 >= SUCCESSES_PER_PHASE ? (
                <button
                  type="button"
                  onClick={handleFeedbackContinue}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFeedbackContinue}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
                >
                  Ready for the next one
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {view === "phase_choice" && phase && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            You&apos;ve completed three strong {phase.label} responses.
          </h3>
          <p className="mt-2 text-slate-700">
            Would you like to keep practicing {phase.label}, or move on?
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={continueSamePhase}
              className="rounded-lg border border-teal-600 bg-white px-4 py-3 font-semibold text-teal-900"
            >
              Continue practicing {phase.label}
            </button>
            <button
              type="button"
              onClick={advanceToNextPhase}
              className="rounded-lg bg-[var(--primary)] px-4 py-3 font-semibold text-white"
            >
              {phaseIndex >= savePhases.length - 1 ? "Finish the drill" : `Move on to ${savePhases[phaseIndex + 1].label}`}
            </button>
          </div>
        </div>
      )}

      {view === "done" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Great job!</h2>
          <p className="mt-3 text-slate-700">Thanks for practicing.</p>
        </div>
      )}
    </div>
  );
}
