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
    prompt: string;
    context: string;
    status: string;
    result: string;
    projectId: string;
    parentDocId: string;
    targetDocId: string;
    relatedDocs: string[];
    relatedSummaries: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
}
  