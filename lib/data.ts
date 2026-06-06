export type Drill = {
  slug: string;
  title: string;
  skillFocus: string;
  introTextShort: string;
  purpose: string;
};

export const drills: Drill[] = [
  {
    slug: "save-statement",
    title: "SAVE Statement Drill",
    skillFocus: "Empathic responses (SAVE)",
    introTextShort:
      "Practice Support, Acknowledge, Validate, and Emotion naming—one empathic line at a time.",
    purpose: "Build concise empathic statements aligned with the SAVE framework.",
  },
  {
    slug: "active-listening-basics",
    title: "Active Listening Basics",
    skillFocus: "Clarifying questions",
    introTextShort:
      "Focus on asking one clarifying question before offering your own viewpoint.",
    purpose: "Build stronger understanding before responding.",
  },
  {
    slug: "conflict-reframe",
    title: "Conflict Reframe",
    skillFocus: "Neutral language",
    introTextShort:
      "Replace blame phrasing with neutral descriptions of behavior and impact.",
    purpose: "Reduce defensiveness and keep conversations productive.",
  },
  {
    slug: "assertive-request",
    title: "Assertive Request",
    skillFocus: "Clear requests",
    introTextShort:
      "Use one concise statement that includes context, need, and a clear ask.",
    purpose: "Increase clarity and action in difficult conversations.",
  },
];

export const learnerAssignments: Record<string, string[]> = {
  SAVE: ["save-statement"],
  START1: ["active-listening-basics"],
  WEEK2: ["active-listening-basics", "conflict-reframe"],
  ADVANCE: ["active-listening-basics", "conflict-reframe", "assertive-request"],
};

export const educatorPreviewPassword = "educator-demo";
