import { LLMGateway, createGatewayProviders } from '@cpe/llm-gateway';

/** Builds an LLM gateway from environment configuration. */
export function buildGateway(): LLMGateway {
  return new LLMGateway(
    createGatewayProviders(),
    process.env.APP_BASE_URL ?? 'http://localhost:3000',
  );
}
