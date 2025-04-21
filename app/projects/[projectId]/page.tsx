import { db } from '@/lib/db/mongo';
import { notFound } from 'next/navigation';
import ProjectEditor from './page.client';
import { ObjectId } from 'mongodb';


export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const projectId = (await params).projectId;

  if (!projectId) {
    notFound();
  }

  return <ProjectEditor projectId={projectId} />;
} 