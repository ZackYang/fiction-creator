import type { ObjectId, WithId } from "mongodb";

export namespace Type {
  export type Project = WithId<{
    name: string;
    tasks: Task[];
    taskConfig: TaskConfig;
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
    projectId: ObjectId;
    parentDocId?: ObjectId;
    priority: number;
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
