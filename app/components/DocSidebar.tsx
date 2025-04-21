'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, ChevronDown, User, Users, BookOpen, Calendar, Package, MapPin, Zap, Wand2, FileText, Newspaper, AlertCircle, FileWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { Type } from '@/lib/types';

interface DocSidebarProps {
  projectId: string;
  onDocSelect?: (docId: string) => void;
  selectedDocId?: string;
  onRefresh?: () => void;
}

export default function DocSidebar({ projectId, onDocSelect, selectedDocId, onRefresh }: DocSidebarProps) {
  const [docs, setDocs] = useState<Type.Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<Type.DocType>('other');
  const [parentDocId, setParentDocId] = useState<string | null>(null);
  const [showSubDocDialog, setShowSubDocDialog] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
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
      
      // 自动展开所有文档
      const allDocIds = data.data.map((doc: Type.Doc) => doc._id.toString());
      setExpandedDocs(new Set(allDocIds));
    } catch (error) {
      console.error('Error fetching docs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load documents');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchDocs();
    };

    window.addEventListener('refreshDocs', handleRefresh);
    return () => {
      window.removeEventListener('refreshDocs', handleRefresh);
    };
  }, []);

  const handleCreateDoc = async (title: string, type: Type.DocType, parentId: string | null = null) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title,
          type,
          content: '',
          summary: '',
          parentDocId: parentId || undefined,
          priority: 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create doc');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create doc');
      }

      await fetchDocs();
      toast.success('Document created successfully');
    } catch (error) {
      console.error('Error creating doc:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create document');
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

  const getDocTypeColor = (type: Type.DocType) => {
    switch (type) {
      case 'article':
        return 'bg-gray-50 hover:bg-gray-100';
      case 'character':
        return 'bg-purple-50 hover:bg-purple-100';
      case 'organization':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'background':
        return 'bg-green-50 hover:bg-green-100';
      case 'event':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'item':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'location':
        return 'bg-red-50 hover:bg-red-100';
      case 'ability':
        return 'bg-indigo-50 hover:bg-indigo-100';
      case 'spell':
        return 'bg-pink-50 hover:bg-pink-100';
      case 'other':
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const getDocTypeIcon = (type: Type.DocType) => {
    switch (type) {
      case 'article':
        return <Newspaper size={16} className="text-gray-500" />;
      case 'character':
        return <User size={16} className="text-purple-500" />;
      case 'organization':
        return <Users size={16} className="text-blue-500" />;
      case 'background':
        return <BookOpen size={16} className="text-green-500" />;
      case 'event':
        return <Calendar size={16} className="text-yellow-500" />;
      case 'item':
        return <Package size={16} className="text-orange-500" />;
      case 'location':
        return <MapPin size={16} className="text-red-500" />;
      case 'ability':
        return <Zap size={16} className="text-indigo-500" />;
      case 'spell':
        return <Wand2 size={16} className="text-pink-500" />;
      case 'other':
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const renderDocItem = (doc: Type.Doc, level = 0) => {
    const hasChildren = docs.some(d => d.parentDocId?.toString() === doc._id.toString());
    const isExpanded = expandedDocs.has(doc._id.toString());
    const isSelected = doc._id.toString() === selectedDocId;
    const typeColor = getDocTypeColor(doc.type);
    const typeIcon = getDocTypeIcon(doc.type);
    const missingContent = !doc.content || doc.content.trim() === '';
    const missingSummary = !doc.summary || doc.summary.trim() === '';

    return (
      <div key={doc._id.toString()}>
        <div
          className={`flex items-center justify-between gap-2 px-4 py-2 cursor-pointer group ${
            isSelected 
              ? 'bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-500' 
              : `${typeColor}`
          }`}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
          onClick={() => {
            if (onDocSelect) {
              onDocSelect(doc._id.toString());
            } else {
              router.push(`/projects/${projectId}/docs/${doc._id.toString()}`);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {typeIcon}
            <span className="flex-1 truncate">{doc.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {missingContent && (
              <AlertCircle 
                size={16} 
                className="text-red-500" 
                aria-label="缺少内容"
              />
            )}
            {missingSummary && (
              <FileWarning 
                size={16} 
                className="text-yellow-500" 
                aria-label="缺少摘要"
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setParentDocId(doc._id.toString());
                setShowSubDocDialog(true);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="创建子文档"
            >
              <Plus size={16} />
            </button>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(doc._id.toString());
                }}
                className={`p-1 rounded ${
                  isSelected 
                    ? 'text-blue-700 hover:bg-blue-200' 
                    : 'hover:bg-gray-200'
                }`}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {docs
              .filter(d => d.parentDocId?.toString() === doc._id.toString())
              .map(childDoc => renderDocItem(childDoc, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault(); // 防止文本选择
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return;

    const newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = 600;
    
    // 确保宽度在合理范围内
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      sidebarRef.current.style.width = `${newWidth}px`;
    } else if (newWidth < minWidth) {
      sidebarRef.current.style.width = `${minWidth}px`;
    } else if (newWidth > maxWidth) {
      sidebarRef.current.style.width = `${maxWidth}px`;
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
    <div 
      ref={sidebarRef}
      className="relative bg-white border-r border-gray-200 flex flex-col"
      style={{ width: '256px', minWidth: '200px', maxWidth: '600px' }}
    >
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowNewDocDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={16} />
          New Document
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {docs
          .filter(doc => !doc.parentDocId)
          .map(doc => renderDocItem(doc))}
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:opacity-50"
        onMouseDown={handleMouseDown}
      />

      {/* New Document Dialog */}
      {showNewDocDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create New Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as Type.DocType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="character">Character</option>
                  <option value="organization">Organization</option>
                  <option value="background">Background</option>
                  <option value="event">Event</option>
                  <option value="item">Item</option>
                  <option value="location">Location</option>
                  <option value="ability">Ability</option>
                  <option value="spell">Spell</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewDocDialog(false);
                  setNewDocTitle('');
                  setNewDocType('other');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newDocTitle.trim()) {
                    await handleCreateDoc(newDocTitle.trim(), newDocType);
                    setShowNewDocDialog(false);
                    setNewDocTitle('');
                    setNewDocType('other');
                  } else {
                    toast.error('Please enter a document title');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Sub-Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as Type.DocType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="character">Character</option>
                  <option value="organization">Organization</option>
                  <option value="background">Background</option>
                  <option value="event">Event</option>
                  <option value="item">Item</option>
                  <option value="location">Location</option>
                  <option value="ability">Ability</option>
                  <option value="spell">Spell</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSubDocDialog(false);
                  setNewDocTitle('');
                  setNewDocType('other');
                  setParentDocId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newDocTitle.trim() && parentDocId) {
                    await handleCreateDoc(newDocTitle.trim(), newDocType, parentDocId);
                    setShowSubDocDialog(false);
                    setNewDocTitle('');
                    setNewDocType('other');
                    setParentDocId(null);
                  } else if (!newDocTitle.trim()) {
                    toast.error('Please enter a document title');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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