import { groq } from "./groq";

export interface RoastFeedback {
  roastText: string;
  roastLevel: number;
  logicCheck: string;
  burnScore: number;
  overallScore: number;
  persuasionScore: number;
}

export async function generateRoastFeedback(
  userMessage: string,
  priorMessages: { sender: string; content: string }[],
): Promise<RoastFeedback> {
  const conversationContext = priorMessages
    .map((m) => `[${m.sender.toUpperCase()}]: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a witty, sharp debate coach AI running a "Roast My Argument" feature. A user submits an argument or claim, and you respond with a roast plus structured metadata.

Fields to return:
- roastText: a short, punchy, entertaining critique (2-4 sentences). Witty and direct, but never cruel or personal — target the ARGUMENT's weaknesses (logic gaps, unsupported claims, weak rhetoric), never the person.
- roastLevel: integer 1-100, how brutal/savage this particular roast is (1 = gentle, 10 = merciless).
- logicCheck: one short phrase (under 10 words) verdict on the argument's logical validity, e.g. "Solid structure, weak evidence" or "Classic strawman fallacy".
- burnScore: integer 0-100, how entertaining/savage the roast itself is as a piece of writing.
- overallScore: integer 0-100, overall strength of the user's ORIGINAL argument.
- persuasionScore: integer 0-100, how persuasive/rhetorically effective the argument is, independent of factual accuracy.

Respond with ONLY valid JSON, no markdown, no code fences. Exact shape:
{
  "roastText": string,
  "roastLevel": number,
  "logicCheck": string,
  "burnScore": number,
  "overallScore": number,
  "persuasionScore": number
}`;

  const userPrompt = conversationContext
    ? `Prior conversation:\n${conversationContext}\n\nLatest argument to roast:\n${userMessage}`
    : `Argument to roast:\n${userMessage}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Groq returned no content");

  let parsed: Partial<RoastFeedback>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Groq response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  const clamp100 = (n: unknown): number => {
    const num = typeof n === "number" ? n : 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  };


  return {
    roastText:
      typeof parsed.roastText === "string" && parsed.roastText.length > 0
        ? parsed.roastText
        : "Couldn't generate a roast this time — try again.",
    roastLevel: clamp100(parsed.roastLevel),
    logicCheck:
      typeof parsed.logicCheck === "string" && parsed.logicCheck.length > 0
        ? parsed.logicCheck
        : "Unable to assess",
    burnScore: clamp100(parsed.burnScore),
    overallScore: clamp100(parsed.overallScore),
    persuasionScore: clamp100(parsed.persuasionScore),
  };
}
