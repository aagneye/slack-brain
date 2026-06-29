import { LLMGateway, OpenAIProvider, AnthropicProvider } from '@cpe/llm-gateway';

/** Builds an LLM gateway from environment configuration. */
export function buildGateway(): LLMGateway {
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
    : undefined;
  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY })
    : undefined;

  return new LLMGateway(
    { openai, anthropic },
    process.env.APP_BASE_URL ?? 'http://localhost:3000',
  );
}
