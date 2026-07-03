const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:12b';
const OLLAMA_TEMPERATURE = parseFloat(process.env.OLLAMA_TEMPERATURE || '0.4');
const OLLAMA_CONTEXT_LENGTH = parseInt(process.env.OLLAMA_CONTEXT_LENGTH || '8192');

export interface OllamaConfig {
  model?: string;
  temperature?: number;
  contextLength?: number;
  systemPrompt?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert health content writer specializing in senior health and wellness.
Write in clear, accessible English suitable for seniors (Grade 6 reading level).
Use cautious language: "may help" instead of "cures" or "treats".
Include practical tips and actionable advice.
Cite general medical principles without making specific medical claims.
Output in Markdown format.
Do not use AI phrases like "As an AI" or "I cannot provide medical advice".
Do not think out loud or explain your reasoning.
Do not use tags like [INST] or [/INST] or any thinking markers.
Just provide the final answer directly without any preamble or meta commentary.`;

export class OllamaClient {
  private model: string;
  private temperature: number;
  private contextLength: number;
  private systemPrompt: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: OllamaConfig) {
    this.model = config.model || OLLAMA_MODEL;
    this.temperature = config.temperature || OLLAMA_TEMPERATURE;
    this.contextLength = config.contextLength || OLLAMA_CONTEXT_LENGTH;
    this.systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    this.maxRetries = config.maxRetries || 2;
    this.retryDelayMs = config.retryDelayMs || 3000;
  }

  getModel(): string {
    return this.model;
  }

  private shouldRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unexpected eof') ||
           message.includes('500') ||
           message.includes('connection reset') ||
           message.includes('timeout');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate(prompt: string, systemPrompt?: string, signal?: AbortSignal): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt || this.systemPrompt },
              { role: 'user', content: prompt + ' /no_think' },
            ],
            options: {
              temperature: this.temperature,
              num_ctx: this.contextLength,
              num_gpu: -1,
              num_thread: 4,
              mirostat: 0,
              mirostat_eta: 0.1,
              mirostat_tau: 5.0,
              seed: 42,
            },
            stream: false,
          }),
          signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Ollama API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json() as OllamaResponse;
        return data.message.content;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries && this.shouldRetry(lastError)) {
          console.warn(`Ollama generate attempt ${attempt + 1} failed, retrying in ${this.retryDelayMs}ms:`, lastError.message);
          await this.delay(this.retryDelayMs);
        } else {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error');
  }

  async generateJSON(prompt: string, systemPrompt?: string, signal?: AbortSignal): Promise<any> {
    const response = await this.generate(prompt, systemPrompt, signal);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      throw new Error(`Failed to parse JSON from response: ${response}`);
    }
  }

  async generateStream(prompt: string, callback: (chunk: string) => void, systemPrompt?: string, signal?: AbortSignal): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt || this.systemPrompt },
              { role: 'user', content: prompt + ' /no_think' },
            ],
            options: {
              temperature: this.temperature,
              num_ctx: this.contextLength,
              num_gpu: -1,
              num_thread: 4,
              mirostat: 0,
              mirostat_eta: 0.1,
              mirostat_tau: 5.0,
              seed: 42,
            },
            stream: true,
          }),
          signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Ollama API error: ${response.status} - ${errorBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const chunks = decoder.decode(value).split('\n').filter(Boolean);
            for (const chunk of chunks) {
              try {
                const data: OllamaResponse = JSON.parse(chunk);
                if (data.message?.content) {
                  callback(data.message.content);
                }
              } catch {
                continue;
              }
            }
          }
        }

        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries && this.shouldRetry(lastError)) {
          console.warn(`Ollama generateStream attempt ${attempt + 1} failed, retrying in ${this.retryDelayMs}ms:`, lastError.message);
          await this.delay(this.retryDelayMs);
        } else {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error');
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const createOllamaClient = (config?: Partial<OllamaConfig>) => {
  return new OllamaClient({
    model: OLLAMA_MODEL,
    temperature: OLLAMA_TEMPERATURE,
    contextLength: OLLAMA_CONTEXT_LENGTH,
    ...config
  });
};