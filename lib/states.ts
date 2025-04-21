// This file is used to define the json interfaces for the models

export namespace State {
  export type Project = {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Doc = {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Task = {
    id?: string
    prompt?: string;
    context?: string;
    status?: string;
    result?: string;
    projectId?: string;
    parentDocId?: string;
    targetDocId?: string;
    relatedDocs?: string[];
    relatedSummaries?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}