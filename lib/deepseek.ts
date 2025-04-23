import { generateUserMessages, generateUserPrompt, systemPrompt } from './promptGenerator';
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

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.baseUrl = DEEPSEEK_BASE_URL;

    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured. Please set the DEEPSEEK_API_KEY environment variable.');
    }

    if (!this.baseUrl) {
      throw new Error('DeepSeek API base URL is not configured. Please set the DEEPSEEK_BASE_URL environment variable.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    try {
      console.log('Making DeepSeek API request to:', `${this.baseUrl}${endpoint}`);
      console.log('Request options:', {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': 'Bearer [REDACTED]'
        }
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      console.log('DeepSeek API response status:', response.status);
      const responseText = await response.text();
      console.log('DeepSeek API response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Unknown error occurred';
        try {
          const error: DeepSeekError = JSON.parse(responseText);
          errorMessage = error.error?.message || 'Unknown error occurred';
          console.error('DeepSeek API error details:', error);
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        }
        throw new Error(`DeepSeek API error: ${errorMessage}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse success response:', e);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('DeepSeek API request failed:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to communicate with DeepSeek API: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while communicating with DeepSeek API');
    }
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
      model = DEEPSEEK_MODEL,
      max_tokens = 8000,
      temperature = 0.2,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stream = false,
    } = options;

    console.log('Generating completion for task:', {
      taskId: task._id,
      type: task.type,
      docId: task.docId
    });
    
    const userMessages = await generateUserMessages(task);
    const prompt = await generateUserPrompt(task);

    console.log('Generated messages:', {
      userMessagesLength: userMessages.length,
      promptLength: prompt.length
    });

    try {
      const response: DeepSeekResponse = await this.request('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt(),
            },
            {
              role: 'user',
              content: userMessages + '\n\n' + prompt,
            }
          ],
          max_tokens,
          temperature,
          top_p,
          frequency_penalty,
          presence_penalty,
          stream,
        }),
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No content in response');
      }

      return response.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate completion: ${error.message}`);
      }
      throw error;
    }
  }
}
