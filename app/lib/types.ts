import { ObjectId } from 'mongodb';

export interface Task {
  _id: string;
  projectId: string;
  docId: string;
  type: 'content' | 'summary' | 'outline' | 'improve';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  relatedDocs: string[];
  relatedSummaries: string[];
  prompt?: string;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoTask {
  _id: ObjectId;
  projectId: ObjectId;
  docId: ObjectId;
  type: 'content' | 'summary' | 'outline' | 'improve';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  relatedDocs: ObjectId[];
  relatedSummaries: ObjectId[];
  prompt?: string;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export namespace Type {
  export interface Task {
    _id: string;
    projectId: string;
    docId: string;
    type: 'content' | 'summary' | 'outline' | 'improve';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    relatedDocs: string[];
    relatedSummaries: string[];
    prompt?: string;
    result?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface MongoTask {
    _id: ObjectId;
    projectId: ObjectId;
    docId: ObjectId;
    type: 'content' | 'summary' | 'outline' | 'improve';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    relatedDocs: ObjectId[];
    relatedSummaries: ObjectId[];
    prompt?: string;
    result?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
  }
} 