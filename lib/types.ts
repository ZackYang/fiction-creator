import type { ObjectId, WithId } from "mongodb";

export namespace Type {
  export type Project = WithId<{
    name: string;
    fixedContextDocs: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    author: string;
  }>;

  export type DocType = 'character' | 'organization' | 'background' | 'event' | 'item' | 'location' | 'ability' | 'spell' | 'other';

  export type Doc = WithId<{
    name: string;
    type: DocType;
    description: string;
    summary: string;
    projectId: ObjectId;
    parentDocId: string;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
  }>;

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
  