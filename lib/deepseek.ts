import { generateUserMessages, systemPrompt } from './promptGenerator';
import { Type } from './types';
import fs from 'fs';
import { AI_API } from './ai-apis';

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
  async generateCompletion(
    task: Type.Task,
    onChunk: (chunk: string) => void,
    aiApi: AI_API
  ): Promise<string> {
    const {
      model,
      baseURL,
      maxTokens,
      temperature,
    } = aiApi;
    
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
      max_tokens: parseInt(maxTokens.toString()),
      temperature: parseFloat(temperature.toString()),
      stream: true,
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    console.log('AI API:', aiApi);

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApi.apiKey}`,
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
