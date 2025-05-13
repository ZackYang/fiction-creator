'use client';

import DocSidebar from '@/app/components/DocSidebar';
import { useParams } from 'next/navigation';
import { use } from 'react';
import { useState } from 'react';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const docId = useParams().docId as string;
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-full">
      <DocSidebar 
        projectId={projectId} 
        selectedDocId={docId} 
        onRefresh={handleRefresh}
        key={refreshKey}
      />
      <main className="flex-1 overflow-auto w-3/4">
        {children}
      </main>
    </div>
  );
} 