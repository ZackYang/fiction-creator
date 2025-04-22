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
      max_tokens = -1,
      temperature = 0.2,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stream = false,
    } = options;

    console.log('task');
    console.log(task);
    
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

export async function generateContent(
  prompt: string,
  context: string,
  relatedDocs: string[],
  relatedSummaries: string[]
): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的写作助手。请根据以下上下文和相关文档，生成高质量的内容。
            要求：
            1. 内容要符合上下文和文档的风格
            2. 保持逻辑连贯性
            3. 语言要自然流畅
            4. 避免重复和冗余
            5. 确保内容的完整性和准确性`
          },
          {
            role: 'user',
            content: `上下文：${context}\n\n相关文档：${relatedDocs.join('\n')}\n\n相关摘要：${relatedSummaries.join('\n')}\n\n请根据以上内容，${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate content');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

export async function generateSummary(
  content: string,
  context: string,
  relatedDocs: string[],
  relatedSummaries: string[]
): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的写作助手。请根据以下内容生成简洁的摘要。
            要求：
            1. 摘要要抓住主要内容
            2. 语言要简洁明了
            3. 保持逻辑连贯性
            4. 避免遗漏重要信息
            5. 确保摘要的准确性和完整性`
          },
          {
            role: 'user',
            content: `上下文：${context}\n\n相关文档：${relatedDocs.join('\n')}\n\n相关摘要：${relatedSummaries.join('\n')}\n\n请为以下内容生成摘要：${content}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate summary');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

export async function generateOutline(
  content: string,
  context: string,
  relatedDocs: string[],
  relatedSummaries: string[]
): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的写作助手。请根据以下内容生成详细的大纲。
            要求：
            1. 大纲要层次分明
            2. 结构要合理
            3. 内容要完整
            4. 逻辑要清晰
            5. 确保大纲的实用性和可操作性`
          },
          {
            role: 'user',
            content: `上下文：${context}\n\n相关文档：${relatedDocs.join('\n')}\n\n相关摘要：${relatedSummaries.join('\n')}\n\n请为以下内容生成大纲：${content}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate outline');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating outline:', error);
    throw error;
  }
}

export async function improveContent(
  content: string,
  context: string,
  relatedDocs: string[],
  relatedSummaries: string[]
): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的写作助手。请优化以下内容。
            要求：
            1. 保持原文的主要内容和风格
            2. 改进语言表达
            3. 优化逻辑结构
            4. 增强可读性
            5. 确保内容的准确性和完整性`
          },
          {
            role: 'user',
            content: `上下文：${context}\n\n相关文档：${relatedDocs.join('\n')}\n\n相关摘要：${relatedSummaries.join('\n')}\n\n请优化以下内容：${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to improve content');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error improving content:', error);
    throw error;
  }
}
