import type { ObjectId, WithId } from "mongodb";

export namespace Type {
  export type Project = WithId<{
    name: string;
    tasks: Task[];
    taskConfigs: TaskConfig[];
    createdAt: Date;
    updatedAt: Date;
    author: string;
  }>;

  export type DocType = 'article' | 'character' | 'organization' | 'background' | 'event' | 'item' | 'location' | 'ability' | 'spell' | 'other';

  export interface Doc {
    _id: ObjectId;
    title: string;
    type: DocType;
    content: string;
    summary: string;
    projectId: ObjectId;
    parentDocId?: ObjectId;
    priority: number;
    relatedDocs: ObjectId[];
    relatedSummaries: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
  }

  export type TaskConfig = {
    relatedDocs?: ObjectId[];
    relatedSummaries?: ObjectId[];
    prompt?: string;
  }

  // extend TaskConfig to Task
  export type Task = WithId<TaskConfig & {
    _id: ObjectId;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    type: 'content' | 'summary' | 'outline' | 'improve' | 'general';
    result: string;
    projectId: ObjectId;
    docId: ObjectId;
    context: string;
    createdAt: Date;
    updatedAt: Date;
  }>
}
