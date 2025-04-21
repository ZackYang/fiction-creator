import DocSidebar from '@/app/components/DocSidebar';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="flex h-full">
      <DocSidebar projectId={projectId} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 