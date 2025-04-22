// This file is used to define the json interfaces for the models

export namespace State {
  export type Project = {
    id?: string;
    name?: string;
    taskConfigs?: TaskConfig[];
    tasks?: Task[];
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Doc = {
    id?: string;
    title?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type TaskConfig = {
    id?: string;
    prompt?: string;
    context?: string;
    type?: string;
    status?: string;
  }

  export type Task = TaskConfig & {
    id?: string;
    result?: string;
    projectId?: string;
    docId?: string;
    relatedDocs?: string[];
    relatedSummaries?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}