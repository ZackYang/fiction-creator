'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Doc {
  _id: string;
  name: string;
  parentDocId?: string | null;
  priority?: number;
}

interface DocSidebarProps {
  projectId: string;
  onDocSelect?: (docId: string) => void;
}

export default function DocSidebar({ projectId, onDocSelect }: DocSidebarProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [parentDocId, setParentDocId] = useState<string | null>(null);
  const [showSubDocDialog, setShowSubDocDialog] = useState(false);
  const router = useRouter();

  const fetchDocs = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch docs');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch docs');
      }
      setDocs(data.data || []);
    } catch (error) {
      console.error('Error fetching docs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load documents');
      setDocs([]); // 清空文档列表
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  const handleCreateDoc = async (name: string, parentId: string | null = null) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parentDocId: parentId }),
      });

      if (!response.ok) throw new Error('Failed to create doc');
      
      await fetchDocs();
      toast.success('Document created successfully');
    } catch (error) {
      console.error('Error creating doc:', error);
      toast.error('Failed to create document');
    }
  };

  const toggleExpand = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const renderDocItem = (doc: Doc, level = 0) => {
    const hasChildren = docs.some(d => d.parentDocId === doc._id);
    const isExpanded = expandedDocs.has(doc._id);

    return (
      <div key={doc._id}>
        <div
          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer ${
            level > 0 ? 'pl-' + (level * 4 + 4) : ''
          }`}
          onClick={() => {
            if (onDocSelect) {
              onDocSelect(doc._id);
            } else {
              router.push(`/projects/${projectId}/docs/${doc._id}`);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(doc._id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <span className="flex-1 truncate">{doc.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setParentDocId(doc._id);
              setShowSubDocDialog(true);
            }}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
          >
            <Plus size={16} />
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {docs
              .filter(d => d.parentDocId === doc._id)
              .map(childDoc => renderDocItem(childDoc, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowNewDocDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={16} />
          New Document
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-4rem)]">
        {docs
          .filter(doc => !doc.parentDocId)
          .map(doc => renderDocItem(doc))}
      </div>

      {/* New Document Dialog */}
      {showNewDocDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create New Document</h2>
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Document name"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewDocDialog(false);
                  setNewDocName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newDocName.trim()) {
                    await handleCreateDoc(newDocName.trim());
                    setShowNewDocDialog(false);
                    setNewDocName('');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sub-Document Dialog */}
      {showSubDocDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create New Sub-Document</h2>
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Document name"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSubDocDialog(false);
                  setNewDocName('');
                  setParentDocId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newDocName.trim() && parentDocId) {
                    await handleCreateDoc(newDocName.trim(), parentDocId);
                    setShowSubDocDialog(false);
                    setNewDocName('');
                    setParentDocId(null);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 