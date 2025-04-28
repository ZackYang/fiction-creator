import { generateUserMessages, systemPrompt } from './promptGenerator';
import { Type } from './types';
import fs from 'fs';
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
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-reasoner';
const MAX_TOKENS = process.env.MAX_TOKENS || 8000;

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
    onChunk?: (chunk: string) => void,
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
      max_tokens = MAX_TOKENS,
      temperature = 1.2,
      top_p = 0.95,
      frequency_penalty = 0,
      presence_penalty = 0,
      stream = true,
    } = options;
    
    const userMessages = await generateUserMessages(task);
    // save userMessages to file
    fs.writeFileSync('userMessages.json', JSON.stringify(userMessages, null, 2));

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt(),
        },
        ...userMessages
      ],
      max_tokens: parseInt(max_tokens.toString()),
      temperature: parseFloat(temperature.toString()),
      top_p: parseFloat(top_p.toString()),
      frequency_penalty: parseFloat(frequency_penalty.toString()),
      presence_penalty: parseFloat(presence_penalty.toString()),
      stream,
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error response:', errorText);
        let errorMessage = 'Unknown error occurred';
        try {
          const error: DeepSeekError = JSON.parse(errorText);
          errorMessage = error.error?.message || 'Unknown error occurred';
          console.error('DeepSeek API error details:', error);
        } catch (e) {
          errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        }
        throw new Error(`DeepSeek API error: ${errorMessage}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed: StreamResponse = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (e) {
              console.error('Failed to parse stream data:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate completion: ${error.message}`);
      }
      throw error;
    }
  }
}
