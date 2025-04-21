import { Type } from './types';
import { db } from './db/mongo';

export function systemPrompt(): string {
  return `你是一个专业的写作助手，请根据以下要求完成任务：\n\n`;
}

export async function generateUserMessages(task: Type.Task): Promise<string> {
  const Doc = await db.docs();
  const relatedDocs = await Doc.find({ _id: { $in: task.relatedDocs } }).toArray();
  const relatedSummaries = await Doc.find({ _id: { $in: task.relatedSummaries } }).toArray();

  const message = `以下是一些相关的文档和摘要，请参考这些内容
  
  
摘要：
  ${relatedSummaries.map((summary) => `#${summary.title}\n${summary.content}`).join('\n\n\n')}



文档：
${relatedDocs.map((doc) => `#${doc.title}\n${doc.content}`).join('\n\n\n')}
`

  return message;
}

export async function generateUserPrompt(task: Type.Task): Promise<string> {
  if (task.prompt) {
    return task.prompt;
  }

  const Doc = await db.docs();
  const currentDoc = await Doc.findOne({ _id: task.docId });

  const { type } = task;

  if (type === 'content') {
    throw new Error('content type is not supported');
  } else if (type === 'outline') {
    return `请根据以下文档和摘要生成本章大纲:${currentDoc?.content}`;
  } else if (type === 'summary') {
    return `请为以下文档生成一个详细的摘要，该摘要将用于生成后续的文档的提示：

标题：${currentDoc?.title}
类型：${currentDoc?.type}
内容：${currentDoc?.content}

请提供一个详细的摘要，包括文档的主要内容和关键要点。不少于1000字。摘要的返回格式为markdown格式。不能有任何的解释，只能有摘要。
不能有任何的猜想，只能有事实。`;
  }
  
  throw new Error(`Unsupported task type: ${type}`);
}
