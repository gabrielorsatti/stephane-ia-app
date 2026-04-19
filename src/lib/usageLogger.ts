import { getSupabase } from "./supabase";
import type { TokenUsage } from "./llm";

// Cost per 1M tokens (USD). Adjust as pricing changes.
const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.60;

export function estimateCost(usage: TokenUsage): number {
  return (
    (usage.inputTokens * INPUT_COST_PER_M) / 1_000_000 +
    (usage.outputTokens * OUTPUT_COST_PER_M) / 1_000_000
  );
}

export async function logUsage(userId: string, usage: TokenUsage): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  const cost = estimateCost(usage);

  const { error } = await client.from("api_usage_logs").insert({
    user_id: userId,
    model_name: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    estimated_cost: cost,
  });

  if (error) {
    console.warn("[usageLogger] insert failed", error.message);
  }
}
