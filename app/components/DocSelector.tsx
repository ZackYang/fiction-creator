import { useState, useEffect } from 'react';
import { State } from '@/lib/states';
import { X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DocWithChildren extends State.Doc {
  _id?: string;
  children?: DocWithChildren[];
  parentDocId?: string;
  type?: State.DocType;
  content?: string;
  summary?: string;
}

interface DocSelectorProps {
  projectId: string;
  selectedDocIds: string[];
  onDocsChange: (docs: string[]) => void;
}

const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'bg-purple-100 text-purple-700';
      case 'organization':
        return 'bg-green-100 text-green-700';
      case 'location':
        return 'bg-blue-100 text-blue-700';
      case 'item':
        return 'bg-yellow-100 text-yellow-700';
      case 'event':
        return 'bg-red-100 text-red-700';
      case 'article':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return '👤';
      case 'organization':
        return '🏢';
      case 'location':
        return '📍';
      case 'item':
        return '🔮';
      case 'event':
        return '🎯';
      case 'article':
        return '📄';
      case 'spell':
        return '🔮';
      default:
        return '📝';
    }
  };

interface SortableDocItemProps {
  doc: DocWithChildren;
  onRemove: () => void;
}

function SortableDocItem({ doc, onRemove }: SortableDocItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc._id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 rounded bg-gray-50 mb-1"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>
        <span className="truncate">{doc.title || '未命名文档'}</span>
      </div>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

export default function DocSelector({ projectId, selectedDocIds, onDocsChange }: DocSelectorProps) {
  const [docs, setDocs] = useState<DocWithChildren[]>([]);
  const [allDocs, setAllDocs] = useState<State.Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  const fetchDocs = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch docs');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch docs');
      }

      setAllDocs(data.data);
      
      // 构建文档树
      const docsMap = new Map<string, DocWithChildren>();
      const rootDocs: DocWithChildren[] = [];
      
      // 首先将所有文档添加到 map 中
      data.data.forEach((doc: any) => {
        const docId = doc._id.toString();
        docsMap.set(docId, {
          ...doc,
          id: docId,
          children: []
        });
      });
      
      // 然后构建树结构
      data.data.forEach((doc: any) => {
        const docId = doc._id.toString();
        const docWithChildren = docsMap.get(docId)!;
        const parentDocId = doc.parentDocId?.toString();
        
        if (parentDocId) {
          const parent = docsMap.get(parentDocId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(docWithChildren);
          } else {
            rootDocs.push(docWithChildren);
          }
        } else {
          rootDocs.push(docWithChildren);
        }
      });
      
      setDocs(rootDocs);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDocs = allDocs.filter(doc => selectedDocIds.includes(doc._id!));

  const isDocSelected = (docId: string) => {
    return selectedDocs.some(doc => doc._id?.toString() === docId);
  };

  const handleDocSelect = (doc: DocWithChildren) => {
    if (!doc._id) return;
    const docId = doc._id.toString();
    if (isDocSelected(docId)) {
      onDocsChange(selectedDocIds.filter(id => id !== docId));
    } else {
      onDocsChange([...selectedDocIds, docId]);
    }
  };

  const renderDocItem = (doc: DocWithChildren, level: number = 0) => {
    if (!doc._id) return null;
    const docId = doc._id.toString();
    const isSelected = selectedDocIds.includes(docId);
    const hasChildren = doc.children && doc.children.length > 0;
    const typeColor = getDocTypeColor(doc.type || 'other');
    const typeIcon = getDocTypeIcon(doc.type || 'other');
    const missingContent = !doc.content || doc.content.trim() === '';
    const missingSummary = !doc.summary || doc.summary.trim() === '';

    return (
      <div key={docId} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded ${
            isSelected
              ? 'bg-blue-50 border border-blue-200'
              : 'cursor-pointer hover:bg-gray-50'
          }`}
          onClick={() => handleDocSelect(doc)}
        >
          {Array(level).fill(0).map((_, i) => (
            <div key={i} className="w-4" />
          ))}
          {hasChildren ? (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <div className="w-4" />
          )}
          <div className={`flex-1 truncate ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${typeColor}`}>
              {typeIcon}
            </span>
            {doc.title}
          </div>
          <div className="flex items-center gap-1">
            {missingContent && (
              <span className="text-red-500" title="缺少内容">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            )}
            {missingSummary && (
              <span className="text-yellow-500" title="缺少摘要">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            )}
          </div>
        </div>
        {hasChildren && doc.children?.map(child => renderDocItem(child, level + 1))}
      </div>
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedDocIds.indexOf(active.id as string);
      const newIndex = selectedDocIds.indexOf(over.id as string);
      
      // 创建新的数组并更新顺序
      const newOrder = arrayMove([...selectedDocIds], oldIndex, newIndex);
      
      // 确保顺序正确后调用 onDocsChange
      onDocsChange(newOrder);
    }
  };

  const renderSelectedList = (docs: DocWithChildren[]) => {
    // 确保 selectedDocs 的顺序与 selectedDocIds 一致
    const orderedSelectedDocs = selectedDocIds
      .map(id => selectedDocs.find(doc => doc._id === id))
      .filter((doc): doc is DocWithChildren => doc !== undefined);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedDocIds}
          strategy={verticalListSortingStrategy}
        >
          {orderedSelectedDocs.map(doc => (
            <SortableDocItem
              key={doc._id}
              doc={doc}
              onRemove={() => handleDocSelect(doc)}
            />
          ))}
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-1/2 flex flex-col h-full">
        <label className="block text-sm font-medium mb-2">相关文档</label>
        {isLoading ? (
          <div className="text-center py-4">加载文档中...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-4">暂无文档</div>
        ) : (
          <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
            {docs.map(doc => renderDocItem(doc))}
          </div>
        )}
      </div>

      <div className="w-1/2 flex flex-col h-full">
        <label className="block text-sm font-medium mb-2">已选文档</label>
        {selectedDocs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">请从左侧选择文档</div>
        ) : (
          <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
            {renderSelectedList(selectedDocs)}
          </div>
        )}
      </div>
    </div>
  );
}
