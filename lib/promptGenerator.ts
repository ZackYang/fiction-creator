import { Type } from './types';
import { db } from './db/mongo';
import { State } from './states';
export function systemPrompt(): string {
  return `你是一个专业的写作助手，请根据以下要求完成任务：\n
你需要认真学习我的写作风格，并根据我的写作风格完成任务。所有的小说文本需要有细腻的文笔，以及丰富的情感描写。
  \n`;
}

export function getDocTypeText(type: State.TaskType): string {
  switch (type) {
    case 'content':
      return '内容';
    case 'summary':
      return '摘要';
    case 'outline':
      return '大纲';
    case 'improvement':
      return '优化';
    case 'notes':
      return '笔记';
    case 'other':
      return '其他';
    case 'synopsis':
      return '梗概';
    default:
      return '未知';
  }
}

export async function generateUserMessages(task: Type.Task): Promise<{ role: string; content: string }[]> {
  const Doc = await db.docs();
  const relatedDocsWithType = task.relatedDocs?.map(async (doc) => ({
    doc: await Doc.findOne({ _id: doc.id }),
    type: doc.type as State.TaskType
  }))

  const message = `以下是一些相关的文档和摘要，请参考这些内容`
  let userMessages: { role: string; content: string }[] = []
  const currentDoc = await Doc.findOne({ _id: task.docId });
  userMessages.push({
    role: 'user',
    content: message
  })

  userMessages.push({
    role: 'assistant',
    content: `...`
  })

  if (!relatedDocsWithType) {
    return userMessages;
  }


  for (const docWithType of relatedDocsWithType) {
    const { doc, type } = await docWithType;

    const body = doc?.[type] || '';

    userMessages.push({
      role: 'user',
      content: `以下是文档 #${doc?.title} 的 ${getDocTypeText(type as State.TaskType)}：\n\n${body}`
    })

    userMessages.push({
      role: 'assistant',
      content: `...`
    })
  }

  if (task.type === 'content') {
    if (!task.prompt) {
      throw new Error('content must have a prompt');
    }

    userMessages.push({
      role: 'user',
      content: task.prompt
    })
  }

  if (task.type === 'outline') {
    if (!task.prompt) {
      throw new Error('outline must have a prompt');
    }

    userMessages.push({
      role: 'user',
      content: `请根据以下文档 ${currentDoc?.title} 生成一个${getDocTypeText(task.type as State.TaskType)}：\n\n${currentDoc?.content}\n\n`
    })
  }

  if (task.type === 'improvement') {
    const content = `
以下是当前文档 ${currentDoc?.title} 的内容：

${currentDoc?.content}

${task.prompt || '请根据以上内容打分从不同维度给${currentDoc?.title}打分, 给出总分（100分制）并生成一个优化建议。同时对比其他的知名同类作品的多维度分数(100分制)，分析自己的作品在同类作品中的优缺点。'}
`

    userMessages.push({
      role: 'user',
      content
    })
  }

  if (task.type === 'summary') {    
    userMessages.push({
      role: 'user',
      content: `请为以下文档 ${currentDoc?.title} 生成一个详细的摘要，包括每章的主要故事情节，出现的人物简介，该摘要将用于生成后续的文档的提示, 请不要有任何的后续猜想、建议或者评论：\n\n${currentDoc?.content}\n\n`
    })
  }

  if (task.type === 'notes') {
    if (!task.prompt) {
      throw new Error('notes must have a prompt');
    }
    
    userMessages.push({
      role: 'user',
      content: `以下是文档 ${currentDoc?.title} 的内容：\n\n${currentDoc?.content}\n\n${task.prompt}`
    })
  }

  if (task.type === 'other') {
    if (!task.prompt) {
      throw new Error('other must have a prompt');
    }
    
    userMessages.push({
      role: 'user',
      content: `以下是文档 ${currentDoc?.title} 的内容：\n\n${currentDoc?.content}\n\n${task.prompt}`
    })
  }

  if (task.type === 'synopsis') {
    if (!task.prompt) {
      throw new Error('synopsis must have a prompt');
    }
    
    userMessages.push({
      role: 'user',
      content: `以下是文档 ${currentDoc?.title} 的内容：\n\n${currentDoc?.content}\n\n请根据以上内容生成一个梗概，梗概的返回格式为markdown格式。`
    })
  }

  return userMessages;
}

