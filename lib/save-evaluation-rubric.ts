import type { SaveCategory } from "@/lib/save-drill-config";

export type SaveRubricEntry = {
  skillName: string;
  definition: string;
  examples: string[];
};

/** Responses that should generally be marked MISS regardless of phase. */
export const commonMissPatterns = `
Common responses that should be a MISS:
- Telling them not to feel what they are feeling
- Examples: "Don't worry, it's going to be fine"; "We do this all the time"; "Dr. Johnston is a really good surgeon"; "You're going to be ok"
`.trim();

/** How GPT should phrase one-sentence feedback (UI provides try-again / next buttons). */
export const feedbackGuidance = `
Feedback guidance:
- If CORRECT: give a quick, encouraging one-sentence response. Examples of tone: "Strong work! Are you ready for the next one?"; "Great job! Are you ready for the next one?"; "That's it! Are you ready for the next one?"
- If MISS: be gentle. If they used a different empathic/SAVE skill, name that briefly (e.g. "that was more emotion naming, not support"). Offer one brief model response using the target skill. End with: "Do you want to try again or move on to the next one?"
- Keep feedback to one or two short sentences total. Do not lecture.
`.trim();

/** Leniency rules — reduces false MISSes from strict literal matching. */
export const leniencyRules = `
Scoring leniency (important):
- This is SPOKEN practice transcribed by Whisper. Expect informal grammar, fillers, and paraphrases.
- Mark CORRECT if a reasonable clinician would accept the response as demonstrating the target skill, even if wording differs from examples.
- Do NOT require exact phrases from the examples list.
- Mark CORRECT if the PRIMARY intent is the target skill, even if the line also lightly touches another SAVE element.
- When uncertain between CORRECT and MISS, choose CORRECT if the target skill is reasonably present.
- Only mark MISS when the response clearly fails the target skill OR matches a hard MISS pattern below.
- Short responses (one sentence) are expected and can still be CORRECT.
`.trim();

export const saveSkillDiscriminators = `
How SAVE skills differ (do not MISS just because another skill is adjacent):
- Support = partnership / not alone / we will stay with you (NOT primarily naming difficulty or emotion)
- Acknowledge = names weight of experience or patient strength (NOT primarily normalizing feelings as "natural/ok")
- Validate = feelings make sense / understandable / anyone would feel that (NOT primarily "that was hard" without normalizing)
- Emotion naming = tentatively names the feeling (NOT primarily problem-solving or reassurance)
A response can be CORRECT for the target phase even if a strict pedant might classify another SAVE label secondarily — judge PRIMARY intent for this phase.
`.trim();

export const saveEvaluationRubric: Record<SaveCategory, SaveRubricEntry> = {
  support: {
    skillName: "Support",
    definition:
      "Statements that indicate partnership or non-abandonment to the patient. These let the patient know they are not alone.",
    examples: [
      "I'm here for you",
      "I want you to know you're not alone",
      "We'll be with you every step of the way",
      "Take as much time as you need, I'm here whenever you're ready",
      "You have a whole team watching out for you",
      "We'll figure this out together",
    ],
  },
  acknowledge: {
    skillName: "Acknowledge",
    definition:
      "Statements that acknowledge something.  Usually what the patient has been going through, or acknowledge a positive aspect of the patient.",
    examples: [
      "This must be really hard to handle",
      "I can imagine this is stressful",
      "I can see how hard this is for you",
      "I can tell how much you love him",
      "I know the past few months have been challenging",
      "You must be an incredibly strong person to endure all of this",
      "I can see how much love is in the room"
    ],
  },
  validate: {
    skillName: "Validate",
    definition:
      "Validates the emotions that the patient is feeling.",
    examples: [
      "Anyone would feel upset by that",
      "It's only natural to feel angry sometimes",
      "I think I'd feel the same way if I were you",
      "It's perfectly reasonable to feel sad sometimes",
      "It's ok that you're feeling this way",
      "It makes sense that you'd feel that way",
      "it's ok to feel sad",
      "Of course you feel sad"
    ],
  },
  emotion: {
    skillName: "Emotion naming",
    definition: "Simply seeks to name the emotion you think the patient is feeling.",
    examples: [
      "I imagine you're feeling sad",
      "You seem worried",
      "I am hearing you say that this has been really upsetting",
      "Are you feeling anxious about what happens next?",
      "You sound torn",
    ],
  },
};

export function buildEvaluationSystemPrompt(category: SaveCategory): string {
  const rubric = saveEvaluationRubric[category];
  const target = rubric.skillName.toLowerCase();
  const examples = rubric.examples.map((e) => `- ${e}`).join("\n");

  const rules = `
Verdict rules:
- Mark CORRECT (consistent: true) if the response clearly or reasonably demonstrates ${target}.
- Mark MISS (consistent: false) ONLY if the response clearly does NOT demonstrate ${target}, OR it is a hard MISS pattern (reassurance, minimizing, info-giving, telling them not to feel).
- If the response contains two empathic statements and at least one clearly demonstrates ${target}, mark CORRECT.
- Wrong SAVE skill with clear empathic intent (e.g. validation when phase is support) = MISS, but explain which skill they used in reasoning.
`.trim();

  return `You are a clinical communication coach evaluating a learner's spoken empathic response in a SAVE drill.

TARGET SKILL FOR THIS RESPONSE: ${rubric.skillName}

${rules}

${leniencyRules}

${saveSkillDiscriminators}

TARGET SKILL DEFINITION:
${rubric.definition}

EXAMPLES OF CORRECT ${rubric.skillName.toUpperCase()} RESPONSES (non-exhaustive; paraphrases count):
${examples}

${commonMissPatterns}

${feedbackGuidance}

Reply with JSON only:
{
  "consistent": boolean,
  "feedback": string,
  "reasoning": string
}
- consistent: true if CORRECT, false if MISS
- feedback: one or two short sentences for the learner (follow feedback guidance; do NOT include reasoning here)
- reasoning: 2-4 sentences for the coach/developer explaining: what SAVE skill(s) you detected, why CORRECT or MISS, and any ambiguity`;
}
