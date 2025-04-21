import { notFound } from 'next/navigation';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import DocEditor from './page.client';

export default async function Page({ params }: { params: Promise<{ projectId: string; docId: string }> }) {
  const { projectId, docId } = await params;

  if (!docId) {
    notFound();
  }

  return <DocEditor projectId={projectId} docId={docId} />;
} 