// AI Model Configuration
// Update model names here when providers release new versions
// This single file controls all model options across the application

export interface AIModel {
  id: string
  name: string
  provider: 'xai' | 'google' | 'openai' | 'anthropic'
  icon: string
  description?: string
}

// =============================================================================
// GROK MODELS (xAI)
// Docs: https://docs.x.ai/docs/models
// =============================================================================
export const GROK_MODELS: AIModel[] = [
  {
    id: 'grok-4-1-fast-non-reasoning',
    name: 'Grok 4.1 Fast',
    provider: 'xai',
    icon: '⚡',
    description: 'Fast responses, good for most tasks'
  },
  {
    id: 'grok-4-0709',
    name: 'Grok 4 Full',
    provider: 'xai',
    icon: '🧠',
    description: 'Full reasoning capabilities'
  }
]

// =============================================================================
// GEMINI MODELS (Google)
// Docs: https://ai.google.dev/models
// =============================================================================
export const GEMINI_MODELS: AIModel[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'google',
    icon: '⚡',
    description: 'Fast and efficient'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    icon: '🧠',
    description: 'Advanced reasoning'
  }
]

// =============================================================================
// OPENAI MODELS
// Docs: https://platform.openai.com/docs/models
// =============================================================================
export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-5.2-chat-latest',
    name: 'GPT-5.2 Instant',
    provider: 'openai',
    icon: '⚡',
    description: 'Fast responses'
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    icon: '🧠',
    description: 'Advanced capabilities'
  }
]

// =============================================================================
// CLAUDE MODELS (Anthropic)
// Docs: https://docs.anthropic.com/en/docs/about-claude/models
// =============================================================================
export const CLAUDE_MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    icon: '⚡',
    description: 'Fast and capable'
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    icon: '🧠',
    description: 'Most intelligent'
  }
]

// =============================================================================
// COMBINED / ALL MODELS
// =============================================================================
export const ALL_MODELS: AIModel[] = [
  ...GROK_MODELS,
  ...GEMINI_MODELS,
  ...OPENAI_MODELS,
  ...CLAUDE_MODELS
]

// Special combined analysis option
export const COMBINED_ANALYSIS: AIModel = {
  id: 'combined-analysis',
  name: 'Combined Analysis',
  provider: 'openai', // Uses multiple providers
  icon: '🔄',
  description: 'Analyzes with multiple models'
}

// All available model IDs (for type safety)
export type ModelId =
  | 'grok-4-1-fast-non-reasoning'
  | 'grok-4-0709'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview'
  | 'gpt-5.2-chat-latest'
  | 'gpt-5.2-pro'
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'combined-analysis'

// Default model
export const DEFAULT_MODEL: ModelId = 'grok-4-1-fast-non-reasoning'

// Helper to get model by ID
export const getModelById = (id: string): AIModel | undefined => {
  if (id === 'combined-analysis') return COMBINED_ANALYSIS
  return ALL_MODELS.find(m => m.id === id)
}

// Helper to check provider
export const isGrokModel = (id: string): boolean => id.startsWith('grok-')
export const isGeminiModel = (id: string): boolean => id.startsWith('gemini-')
export const isOpenAIModel = (id: string): boolean => id.startsWith('gpt-') || id === 'combined-analysis'
export const isClaudeModel = (id: string): boolean => id.startsWith('claude-')

// Models used for specific features (update these when changing models)
export const FEATURE_MODELS = {
  // Model for web search (Grok)
  grokWebSearch: 'grok-4-1-fast-non-reasoning',

  // Model for web search (Gemini)
  geminiWebSearch: 'gemini-3-flash-preview',

  // Model for web search (OpenAI)
  openaiWebSearch: 'gpt-5.2-chat-latest',

  // Model for Claude
  claudeDefault: 'claude-sonnet-4-20250514',

  // Model for report suggestions
  reportSuggestions: 'gpt-3.5-turbo'
}
