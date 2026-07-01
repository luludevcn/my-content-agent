const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export interface OllamaConfig {
  model: string;
  temperature?: number;
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

export class OllamaClient {
  private model: string;
  private temperature: number;

  constructor(config: OllamaConfig) {
    this.model = config.model || 'qwen3:14b';
    this.temperature = config.temperature || 0.7;
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json() as OllamaResponse;
    return data.message.content;
  }

  async generateJSON(prompt: string): Promise<any> {
    const response = await this.generate(prompt);
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

  async generateStream(prompt: string, callback: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
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
    model: 'qwen3:14b',
    temperature: 0.7,
    ...config
  });
};
