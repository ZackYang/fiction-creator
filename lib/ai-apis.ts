// DEEPSEEK_API_KEY="sk-4c6729b0fa71489bb169e99ea490a0cc"
// DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
// # DEEPSEEK_MODEL="deepseek-chat"
// DEEPSEEK_MODEL="deepseek-reasoner"
// # MAX_TOKENS=8000


// # DEEPSEEK_API_KEY="sk-88bd69ab1f8d43129d04bcacdb725e51"
// # DEEPSEEK_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
// # DEEPSEEK_MODEL="qwen2.5-72b-instruct"
// # DEEPSEEK_MODEL="qwen2.5-7b-instruct-1m"

export type AI_API = {  
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export const AI_APIS: AI_API[] = [
  {
    name: 'DeepseekChat',
    apiKey: 'sk-4c6729b0fa71489bb169e99ea490a0cc',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    maxTokens: 3000,
    temperature: 1.3,
  },
  {
    name: 'DeepseekReasoner',
    apiKey: 'sk-4c6729b0fa71489bb169e99ea490a0cc',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-reasoner',
    maxTokens: 3000,
    temperature: 1.5,
  },
  {
    name: 'TifaDeepSex 14b',
    apiKey: 'sk-4c6729b0fa71489bb169e99ea490a0cc',
    baseURL: 'http://192.168.20.21:1234/v1',
    model: 'tifa-deepsex-14b-cot',
    maxTokens: 4000,
    temperature: 1.2,
  },
  {
    name: 'TifaDeepSex v2 7b',
    apiKey: 'sk-4c6729b0fa71489bb169e99ea490a0cc',
    baseURL: 'http://192.168.20.21:1234/v1',
    model: 'tifa-deepsexv2-7b-nocot-0325',
    maxTokens: 4000,
    temperature: 1.2,
  },
  {
    name: 'qwen-max',
    apiKey: 'sk-88bd69ab1f8d43129d04bcacdb725e51',
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-max',
    maxTokens: 4000,
    temperature: 1.2,
  },
  {
    name: 'Grok-4-07-09',
    apiKey: 'a7caa007814440618e14d45e42bd5450',
    baseURL: 'https://api.aimlapi.com/v1',
    model: 'x-ai/grok-4-07-09',
    maxTokens: 10000,
    temperature: 0.7,
  },
  {
    name: 'Moonshot Kimi K2 Preview',
    apiKey: 'a7caa007814440618e14d45e42bd5450',
    baseURL: 'https://api.aimlapi.com/v1',
    model: 'moonshot/kimi-k2-preview',
    maxTokens: 3000,
    temperature: 0.7,
  },
  {
    name: 'GPT-5-2025-08-07',
    apiKey: 'a7caa007814440618e14d45e42bd5450',
    baseURL: 'https://api.aimlapi.com/v1',
    model: 'openai/gpt-5-2025-08-07',
    maxTokens: 4000,
    temperature: 1.2,
  }
]