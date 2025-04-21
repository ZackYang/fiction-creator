import { generateUserMessages, generateUserPrompt } from './promptGenerator';
import { Type } from './types';

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: DeepSeekError = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async generateCompletion(
    task: Type.Task,
    options: {
      model?: string;
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    const {
      model = 'deepseek-chat',
      max_tokens = 8192,
      temperature = 0.2,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stream = false,
    } = options;

    const userMessages = await generateUserMessages(task);
    const prompt = await generateUserPrompt(task);

    console.log('userMessages');
    console.log(userMessages);
    console.log('prompt');
    console.log(prompt);

    try {
      const response: DeepSeekResponse = await this.request('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的写作助手，请根据以下要求完成任务：\n\n',
            },
            {
              role: 'user',
              content: userMessages,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens,
          temperature,
          top_p,
          frequency_penalty,
          presence_penalty,
          stream,
        }),
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw error;
    }
  }
}
