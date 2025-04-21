import { MongoClient } from "mongodb";
import type { Type } from "@/lib/types";

export const DATABASE_NAME = "next_commerce";

let mongo: MongoClient | null;

export async function connect(uri = process.env.MONGODB_URI) {
  if (mongo) return mongo;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  mongo = await MongoClient.connect(uri);
  return mongo;
}

export async function disconnect() {
  if (mongo) {
    await mongo.close();
    mongo = null;
  }
}

export async function database() {
  const client = await connect();
  return client.db(DATABASE_NAME);
}

export async function projects() {
  const db = await database();
  return db.collection<Partial<Type.Project>>("projects");
}

export async function docs() {
  const db = await database();
  return db.collection<Partial<Type.Doc>>("docs");
}

export async function tasks() {
  const db = await database();
  return db.collection<Partial<Type.Task>>("tasks");
}

export const db = {
  projects,
  docs,
  tasks,
  disconnect,
};
