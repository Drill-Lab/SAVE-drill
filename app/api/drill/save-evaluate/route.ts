import { NextResponse } from "next/server";
import type { SaveCategory } from "@/lib/save-drill-config";
import { buildEvaluationSystemPrompt, saveEvaluationRubric } from "@/lib/save-evaluation-rubric";

export const runtime = "nodejs";

type Body = {
  category: SaveCategory;
  transcript: string;
};

type EvaluationResult = {
  consistent: boolean;
  feedback: string;
  reasoning?: string;
};

type GptEvaluationJson = {
  consistent?: boolean;
  feedback?: string;
  reasoning?: string;
};

function heuristicEvaluate(category: SaveCategory, text: string): EvaluationResult {
  const t = text.toLowerCase().trim();
  const skill = saveEvaluationRubric[category].skillName;

  if (t.length < 6) {
    return {
      consistent: false,
      feedback: `Try a fuller ${skill.toLowerCase()} statement, then submit again. Do you want to try again or move on to the next one?`,
      reasoning: "Heuristic fallback: response too short to evaluate.",
    };
  }

  const has = (words: string[]) => words.some((w) => t.includes(w));

  switch (category) {
    case "support": {
      const good =
        has(["let's", "lets", "we ", " together", "here for", "not alone", "with you", "step of the way", "team", "figure", "here with", "watching out"]) &&
        !has(["you should", "don't worry", "going to be fine", "going to be ok"]);
      return {
        consistent: good,
        feedback: good
          ? "Strong work! Are you ready for the next one?"
          : `For support, show the patient they are not alone—for example, "${saveEvaluationRubric.support.examples[1]}". Do you want to try again or move on to the next one?`,
        reasoning: good
          ? "Heuristic fallback: detected partnership/non-abandonment language."
          : "Heuristic fallback: missing clear support/partnership cues.",
      };
    }
    case "acknowledge": {
      const good =
        has(["hard", "difficult", "stressful", "imagine", "see how", "challenging", "strong person", "love", "must be", "been through", "lot you've"]);
      return {
        consistent: good,
        feedback: good
          ? "Great job! Are you ready for the next one?"
          : `Let's acknowledge what they've been through—for example, "${saveEvaluationRubric.acknowledge.examples[0]}". Do you want to try again or move on to the next one?`,
        reasoning: good
          ? "Heuristic fallback: detected acknowledgment of difficulty or strength."
          : "Heuristic fallback: missing acknowledgment of experience or strength.",
      };
    }
    case "validate": {
      const good =
        has(["makes sense", "natural", "anyone would", "reasonable", "ok that you're", "understandable", "same way if", "ok to feel", "of course you"]);
      return {
        consistent: good,
        feedback: good
          ? "That's it! Are you ready for the next one?"
          : `For validation, confirm their feelings are natural—for example, "${saveEvaluationRubric.validate.examples[0]}". Do you want to try again or move on to the next one?`,
        reasoning: good
          ? "Heuristic fallback: detected normalization of feelings."
          : "Heuristic fallback: missing validation/normalization language.",
      };
    }
    case "emotion": {
      const good =
        has(["sound", "seem", "feeling", "feel ", "hear", "worried", "sad", "anxious", "upset", "angry", "imagine you're", "torn", "scared", "overwhelmed"]);
      return {
        consistent: good,
        feedback: good
          ? "Strong work! Are you ready for the next one?"
          : `Let's focus on naming the emotion you hear—for example, "${saveEvaluationRubric.emotion.examples[1]}". Do you want to try again or move on to the next one?`,
        reasoning: good
          ? "Heuristic fallback: detected emotion naming language."
          : "Heuristic fallback: missing tentative emotion label.",
      };
    }
  }
}

function logEvaluation(
  category: SaveCategory,
  transcript: string,
  result: EvaluationResult,
  source: "openai" | "heuristic"
) {
  console.info("[save-evaluate]", {
    source,
    category,
    transcript,
    consistent: result.consistent,
    reasoning: result.reasoning ?? "(none)",
    feedback: result.feedback,
  });
}

async function openAiEvaluate(category: SaveCategory, transcript: string): Promise<EvaluationResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    const result = heuristicEvaluate(category, transcript);
    logEvaluation(category, transcript, result, "heuristic");
    return result;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5.5",
      messages: [
        { role: "system", content: buildEvaluationSystemPrompt(category) },
        {
          role: "user",
          content: `Phase target skill: ${saveEvaluationRubric[category].skillName}\nLearner said: """${transcript}"""`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI error", err);
    const result = heuristicEvaluate(category, transcript);
    logEvaluation(category, transcript, result, "heuristic");
    return result;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as GptEvaluationJson;
    const result: EvaluationResult = {
      consistent: Boolean(parsed.consistent),
      feedback:
        typeof parsed.feedback === "string" && parsed.feedback.trim()
          ? parsed.feedback.trim()
          : "Thanks—try once more with a clearer focus on the target skill.",
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning.trim() : undefined,
    };
    logEvaluation(category, transcript, result, "openai");
    return result;
  } catch {
    const result = heuristicEvaluate(category, transcript);
    logEvaluation(category, transcript, result, "heuristic");
    return result;
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.category || !body.transcript?.trim()) {
    return NextResponse.json({ error: "category and transcript required" }, { status: 400 });
  }

  const result = await openAiEvaluate(body.category, body.transcript.trim());

  const includeReasoning =
    process.env.SAVE_EVAL_DEBUG === "1" || process.env.NODE_ENV === "development";

  return NextResponse.json({
    consistent: result.consistent,
    feedback: result.feedback,
    ...(includeReasoning && result.reasoning ? { reasoning: result.reasoning } : {}),
  });
}
