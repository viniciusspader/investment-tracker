import Anthropic from "@anthropic-ai/sdk";

export interface ThesisTicker {
  ticker: string;
  name: string;
  reasoning: string;
  assetType: "stock" | "etf";
}

export async function getThesisTickers(
  thesis: string,
  apiKey: string
): Promise<ThesisTicker[]> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a financial research assistant. Given an investment thesis, suggest 8-10 relevant US-listed stocks or ETFs.

Investment thesis: "${thesis}"

Respond with ONLY a valid JSON array (no markdown, no explanation). Format:
[
  {"ticker": "NVDA", "name": "NVIDIA Corporation", "reasoning": "One sentence why this fits the thesis", "assetType": "stock"},
  ...
]

Rules:
- Only suggest real, US-listed tickers on NYSE/NASDAQ
- Mix stocks and ETFs where appropriate
- assetType must be "stock" or "etf"
- reasoning must be 1 concise sentence`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned) as ThesisTicker[];
  } catch {
    return [];
  }
}
