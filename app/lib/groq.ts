import Groq from "groq-sdk";

const globalForGroq = global as unknown as { groq?: Groq };

function createGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey });
}

export function getGroq(): Groq {
  if (!globalForGroq.groq) {
    globalForGroq.groq = createGroqClient();
  }
  return globalForGroq.groq;
}

export interface DebaterScore {
  overallScore: number;
  logicScore: number;
  persuasionScore: number;
  factCheckAccuracy: number;
  feedbackSummary: string;
}

export interface DebateScoreResult {
  user1: DebaterScore;
  user2: DebaterScore;
}

interface TranscriptTurn {
  speakerLabel: "user1" | "user2";
  content: string;
  turnIndex: number;
}

const FALLBACK_SCORE: DebaterScore = {
  overallScore: 0,
  logicScore: 0,
  persuasionScore: 0,
  factCheckAccuracy: 0,
  feedbackSummary:
    "Scoring is temporarily unavailable. This debate will need to be re-scored.",
};

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

export async function scoreDebateWithGroq(
  topic: string,
  turns: TranscriptTurn[],
): Promise<DebateScoreResult> {
  const transcript = turns
    .sort((a, b) => a.turnIndex - b.turnIndex)
    .map((t) => `[${t.speakerLabel.toUpperCase()}]: ${t.content}`)
    .join("\n\n");

  const systemPrompt = `You are an impartial debate judge AI. You will be given a debate topic and a full transcript between two debaters, labeled USER1 and USER2.

Score each debater on these 4 metrics, each from 0-100:
- overallScore: overall debate performance
- logicScore: strength and coherence of logical reasoning
- persuasionScore: rhetorical skill and persuasiveness
- factCheckAccuracy: factual accuracy of claims made (penalize unsupported or false claims) for the provided topic

Also write a short (4-5 sentence) feedbackSummary for each debater — specific, constructive, mentioning at least one concrete moment from the transcript and provide actionable suggestions for improvement.

Respond with ONLY valid JSON, no markdown formatting, no code fences, no preamble. Exact shape:
{
  "user1": { "overallScore": number, "logicScore": number, "persuasionScore": number, "factCheckAccuracy": number, "feedbackSummary": string },
  "user2": { "overallScore": number, "logicScore": number, "persuasionScore": number, "factCheckAccuracy": number, "feedbackSummary": string }
}`;

  const userPrompt = `Debate topic: "${topic}"\n\nTranscript:\n${transcript} and all arguments must remain relevant to the topic.`;

  let raw: string | undefined;
  try {
    const completion = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    raw = completion.choices[0]?.message?.content ?? undefined;
  } catch (err) {
    console.error("[groq] scoring request failed:", err);
    return { user1: FALLBACK_SCORE, user2: FALLBACK_SCORE };
  }

  if (!raw) {
    console.error("[groq] scoring returned no content");
    return { user1: FALLBACK_SCORE, user2: FALLBACK_SCORE };
  }

  let parsed: Partial<DebateScoreResult>;
  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch (err) {
    console.error(
      `[groq] scoring response was not valid JSON: ${raw.slice(0, 200)}`,
    );
    return { user1: FALLBACK_SCORE, user2: FALLBACK_SCORE };
  }

  const clamp = (n: unknown): number => {
    const num = typeof n === "number" ? n : Number(n);
    return Number.isFinite(num)
      ? Math.max(0, Math.min(100, Math.round(num)))
      : 0;
  };

  const normalize = (s: Partial<DebaterScore> | undefined): DebaterScore => ({
    overallScore: clamp(s?.overallScore),
    logicScore: clamp(s?.logicScore),
    persuasionScore: clamp(s?.persuasionScore),
    factCheckAccuracy: clamp(s?.factCheckAccuracy),
    feedbackSummary:
      typeof s?.feedbackSummary === "string" && s.feedbackSummary.length > 0
        ? s.feedbackSummary
        : "No feedback generated.",
  });

  return {
    user1: normalize(parsed.user1),
    user2: normalize(parsed.user2),
  };
}
