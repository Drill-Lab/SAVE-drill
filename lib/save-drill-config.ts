export type SaveCategory = "support" | "acknowledge" | "validate" | "emotion";

export type SavePhaseConfig = {
  id: SaveCategory;
  label: string;
  letter: string;
  /** Short reminder of what this SAVE type means */
  meaning: string;
  /** Example phrase from the facilitator materials */
  example: string;
  /** Relative to /public — from Opening Scripts - SAVE (sync script copies as *.m4a) */
  introAudio: string;
  /** One audio per patient prompt; same length as textPrompts (Drill-lab clips, .m4a) */
  promptAudio: string[];
  /** Shown if audio is missing or fails to load (matches your Drill-lab filenames, sorted) */
  textPrompts: string[];
};

/** Target successful responses per phase before offering “move on” */
export const SUCCESSES_PER_PHASE = 3;

/**
 * Audio files are copied into `public/audio/save-drill/` by
 * `scripts/sync-drill-audio-from-drive.ps1` from `G:\My Drive\Drill-lab\…`.
 * Browsers play `.m4a` via the HTML audio element.
 */
export const savePhases: SavePhaseConfig[] = [
  {
    id: "support",
    letter: "S",
    label: "Support",
    meaning:
      "Show you are on their side and willing to problem-solve together—without fixing or lecturing.",
    example: 'e.g. “Let’s figure this out together.”',
    introAudio: "/audio/save-drill/support-intro.m4a",
    promptAudio: [
      "/audio/save-drill/support-1.m4a",
      "/audio/save-drill/support-2.m4a",
      "/audio/save-drill/support-3.m4a",
      "/audio/save-drill/support-4.m4a",
      "/audio/save-drill/support-5.m4a",
    ],
    textPrompts: [
      "I feel like I'm being forced to make decisions I don't fully understand.",
      "I just feel really alone.",
      "You keep explaining things but my brain just shuts down when you talk.",
      "I don't know how to talk to the kids about this.",
      "I'm just not ready to talk.",
    ],
  },
  {
    id: "acknowledge",
    letter: "A",
    label: "Acknowledge",
    meaning: "Name the weight of what they went through—without minimizing or debating their experience.",
    example: 'e.g. “That must have been incredibly hard to go through.”',
    introAudio: "/audio/save-drill/acknowledge-intro.m4a",
    promptAudio: [
      "/audio/save-drill/acknowledge-1.m4a",
      "/audio/save-drill/acknowledge-2.m4a",
      "/audio/save-drill/acknowledge-3.m4a",
      "/audio/save-drill/acknowledge-4.m4a",
      "/audio/save-drill/acknowledge-5.m4a",
      "/audio/save-drill/acknowledge-6.m4a",
    ],
    textPrompts: [
      "Every day I feel like I'm getting different information, and it seems like you all aren't even on the same page.",
      "I'm exhausted, but I'm afraid that if I step away, something important will happen.",
      "I'm exhausted. I haven't slept in days.",
      "I'm just not ready to let her go.",
      "You all leave at the end of the day, but I'm the one who has to sit with this all night.",
      "You keep talking about options, but none of them feel like good options.",
    ],
  },
  {
    id: "validate",
    letter: "V",
    label: "Validate",
    meaning: "Normalize their reaction—make it clear their feelings make sense in context.",
    example: 'e.g. “It’s natural to feel that way given what you’ve been through.”',
    introAudio: "/audio/save-drill/validate-intro.m4a",
    promptAudio: [
      "/audio/save-drill/validate-1.m4a",
      "/audio/save-drill/validate-2.m4a",
      "/audio/save-drill/validate-3.m4a",
      "/audio/save-drill/validate-4.m4a",
      "/audio/save-drill/validate-5.m4a",
    ],
    textPrompts: [
      "Every time someone new comes in, I feel like I have to start the whole story over again.",
      "I'm exhausted, but I'm afraid that if I step away, something important will happen when I'm not here.",
      "They just walked into the room and said, 'You're dying.' It was a total shock.",
      "This is so scary, but I know there are people here who have it a lot worse than I do.",
      "I keep thinking there must be some kind of mistake. This can't really be happening to us.",
    ],
  },
  {
    id: "emotion",
    letter: "E",
    label: "Emotion naming",
    meaning: "Reflect the emotion you hear—tentatively and without putting words in their mouth.",
    example: 'e.g. “You seem sad.” / “It sounds like you’re scared.”',
    introAudio: "/audio/save-drill/emotion-naming-intro.m4a",
    promptAudio: [
      "/audio/save-drill/emotion-naming-1.m4a",
      "/audio/save-drill/emotion-naming-2.m4a",
      "/audio/save-drill/emotion-naming-3.m4a",
      "/audio/save-drill/emotion-naming-4.m4a",
      "/audio/save-drill/emotion-naming-5.m4a",
    ],
    textPrompts: [
      "Ever since Sally left, I just haven't wanted to do anything.",
      "Every time the phone rings, I think it's the hospital calling and my heart drops.",
      "I can't think about giving up when he's always been such a fighter.",
      "I don't want to hear anything negative today. I just want you to tell me how I can move forward and get better.",
      "I don't want him to suffer, but I don't want him gone either.",
    ],
  },
];
