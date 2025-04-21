import type { ObjectId, WithId } from "mongodb";

export namespace Type {
  export type Project = WithId<{
    name: string;
    fixedContextDocs: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    author: string;
  }>;

  export type DocType = 'character' | 'organization' | 'background' | 'event' | 'item' | 'location' | 'ability' | 'spell' | 'article' | 'other';

  export interface Doc {
    _id: ObjectId;
    title: string;
    type: DocType;
    content: string;
    summary: string;
    projectId: ObjectId;
    parentDocId?: ObjectId;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export type Task = WithId<{
    _id: ObjectId;
    prompt: string;
    context: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    type: 'content' | 'summary' | 'outline' | 'improve';
    result: string;
    projectId: ObjectId;
    docId: ObjectId;
    relatedDocs: ObjectId[];
    relatedSummaries: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
  }>;
}
  