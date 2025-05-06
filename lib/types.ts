import type { ObjectId, WithId } from "mongodb";

export const DOC_TYPE_LIST = [
  'article',
  'character',
  'organization',
  'background',
  'event',
  'item',
  'location',
  'ability',
  'spell',
  'other',
  'group',
]

export const TASK_TYPE_LIST = [
  'content',
  'summary',
  'improvement',
  'synopsis',
  'outline',
  'notes',
  'other',
]

export namespace Type {
  export type AI_API = {
    name: string;
    apiKey: string;
    baseURL: string;
    model: string;
    maxTokens: number;
    temperature: number;
  }

  export type Project = WithId<{
    name: string;
    tasks: Task[];
    taskConfig?: TaskConfig;
    aiApi: AI_API;
    createdAt: Date;
    updatedAt: Date;
    author: string;
  }>;

  export type DocType = 'article' | 'character' | 'organization' | 'background' | 'event' | 'item' | 'location' | 'ability' | 'spell' | 'other' | 'group';

  export interface Doc {
    _id: ObjectId;
    title: string;
    type: DocType;
    taskConfig: TaskConfig;
    tasks: Task[];
    content: string;
    summary: string;
    outline: string;
    improvement: string;
    notes: string;
    other: string;
    synopsis: string;
    history: {
      type: DocType;
      content: string;
      createdAt: Date;
    }[];
    projectId: ObjectId;
    parentDocId?: ObjectId;
    priority: number;
    achived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export type TaskConfig = {
    relatedDocs?: {
      id: ObjectId;
      type: TaskType;
    }[];
  }

  export type TaskType = 'content' | 'summary' | 'improvement' | 'synopsis' | 'outline' | 'notes' | 'other';

  // extend TaskConfig to Task
  export type Task = WithId<TaskConfig & {
    _id: ObjectId;
    prompt?: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    type: TaskType;
    result: string;
    projectId: ObjectId;
    docId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
  }>
}
