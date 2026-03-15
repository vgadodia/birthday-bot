import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Intent =
  | { action: "add"; name: string; month: number; day: number; year?: number }
  | {
      action: "update";
      name: string;
      month: number;
      day: number;
      year?: number;
    }
  | { action: "delete"; name: string }
  | { action: "list" }
  | { action: "help" }
  | { action: "unknown" };

const systemPrompt = `You are a birthday reminder assistant that parses SMS messages into structured commands.

Extract the user's intent from their message and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

Intent types:
- add: user wants to add a new birthday
- update: user is correcting or changing an existing birthday
- delete: user wants to remove a birthday
- list: user wants to see their saved birthdays
- help: user is confused or asking what the bot does
- unknown: message doesn't match any intent

For add/update, extract:
- name: string (capitalize properly)
- month: number (1-12)
- day: number (1-31)
- year: number or null (only if explicitly stated)

Examples:
"Jake's birthday is June 22" → {"action":"add","name":"Jake","month":6,"day":22,"year":null}
"Actually Jake is June 23" → {"action":"update","name":"Jake","month":6,"day":23,"year":null}
"mom - march 14th" → {"action":"add","name":"Mom","month":3,"day":14,"year":null}
"Sarah turns 30 on July 4th 1995" → {"action":"add","name":"Sarah","month":7,"day":4,"year":1995}
"remove Jake" → {"action":"delete","name":"Jake"}
"who's coming up?" → {"action":"list"}
"what can you do" → {"action":"help"}`;

export async function parseIntent(message: string): Promise<Intent> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return { action: "unknown" };

    const parsed = JSON.parse(text);

    if (parsed.year === null) delete parsed.year;

    return parsed as Intent;
  } catch {
    return { action: "unknown" };
  }
}
