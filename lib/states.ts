// This file is used to define the json interfaces for the models

export namespace State {
  export type Project = {
    _id?: string;
    name?: string;
    taskConfig: TaskConfig;
    tasks?: Task[];
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type DocType = 'article' | 'character' | 'organization' | 'background' | 'event' | 'item' | 'location' | 'ability' | 'spell' | 'other';

  export type Doc = {
    _id?: string;
    title?: string;
    type?: DocType;
    taskConfig?: TaskConfig;
    tasks?: Task[];
    content?: string;
    summary?: string;
    projectId?: string;
    parentDocId?: string;
    priority?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type TaskConfig = {
    _id?: string;
    relatedDocs?: string[];
    relatedSummaries?: string[];
  }

  export type Task = TaskConfig & {
    _id?: string;
    type?: string;
    status?: string;
    prompt?: string;
    result?: string;
    projectId?: string;
    docId?: string;
    relatedDocs?: string[];
    relatedSummaries?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}