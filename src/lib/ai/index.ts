import { AIProvider, AIProviderConfig, ProviderType } from './types';
import { OllamaProvider } from './OllamaProvider';
import { OpenAIProvider } from './OpenAIProvider';

export * from './types';
export * from './OllamaProvider';
export * from './OpenAIProvider';

const providerRegistry: Map<ProviderType, new (config: AIProviderConfig) => AIProvider> = new Map([
  ['ollama', OllamaProvider],
  ['openai', OpenAIProvider]
]);

export function createProvider(config: AIProviderConfig): AIProvider {
  const ProviderClass = providerRegistry.get(config.type);
  
  if (!ProviderClass) {
    throw new Error(`Unknown provider type: ${config.type}`);
  }
  
  return new ProviderClass(config);
}

export function registerProvider(
  type: ProviderType,
  providerClass: new (config: AIProviderConfig) => AIProvider
): void {
  providerRegistry.set(type, providerClass);
}

export { OllamaProvider, OpenAIProvider };
