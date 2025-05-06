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
  selectedDocsIdsWithType: {
    id: string;
    type: State.TaskType
  }[];
  onDocsChange: (docs: {id: string, type: State.TaskType}[]) => void;
}

export const getDocTypeColor = (type: string) => {
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
  
  export const getDocTypeIcon = (type: string) => {
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

export const getTaskTypeText = (type: State.TaskType) => {
    switch (type) {
      case 'content':
        return '内容';
      case 'summary':
        return '摘要';
      case 'outline':
        return '大纲';
      case 'notes':
        return '笔记';
      case 'improvement':
        return '优化';
      case 'synopsis':
        return '梗概';
      case 'other':
        return '其他';
      default:
        return type;
    }
  };
export const getTaskTypeColor = (type: State.TaskType) => {
  switch (type) {
    case 'content':
      return 'bg-blue-100 text-blue-700';
    case 'summary':
      return 'bg-green-100 text-green-700';
    case 'outline':
      return 'bg-purple-100 text-purple-700';
    case 'notes':
      return 'bg-yellow-100 text-yellow-700';
    case 'improvement':
      return 'bg-red-100 text-red-700';
    case 'synopsis':
      return 'bg-indigo-100 text-indigo-700';
    case 'other':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
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
      className={`flex items-center justify-between p-2 rounded bg-gray-50 mb-1 ${getTaskTypeColor(doc.type as State.TaskType)}`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex items-center gap-2">
          <span className="truncate">{doc.title || '未命名文档'}</span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded`}>
            {getTaskTypeText(doc.type as State.TaskType)}
          </span>
        </div>
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

export default function DocSelector({ projectId, selectedDocsIdsWithType, onDocsChange }: DocSelectorProps) {
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

  const selectedDocsWithType = selectedDocsIdsWithType.map(item => {
    const doc = allDocs.find(doc => doc._id?.toString() === item.id);
    if (doc) {
      return {
        ...doc,
        id: doc._id?.toString() || '',
        type: item.type
      };
    }
    return null;
  }).filter((doc): doc is DocWithChildren & { id: string; type: State.TaskType } => doc !== null);

  const handleDocSelect = (doc: DocWithChildren, type: State.TaskType) => {
    if (!doc._id) return;
    const docId = doc._id.toString();
    if (selectedDocsIdsWithType.some(item => item.id === docId && item.type === type)) {
      onDocsChange(selectedDocsIdsWithType.filter(item => item.id !== docId || item.type !== type));
    } else {
      onDocsChange([...selectedDocsIdsWithType, {id: docId, type: type}]);
    }
  };

  const renderDocItem = (doc: DocWithChildren, level: number = 0) => {
    if (!doc._id) return null;
    const docId = doc._id.toString();
    const isSelected = selectedDocsIdsWithType.some(item => item.id === docId);
    const hasChildren = doc.children && doc.children.length > 0;
    const typeColor = getDocTypeColor(doc.type || 'other');
    const typeIcon = getDocTypeIcon(doc.type || 'other');

    const taskTypes: State.TaskType[] = ['content', 'summary', 'outline', 'notes', 'other', 'improvement', 'synopsis'];

    // 检查每个字段是否为空
    const isContentEmpty = !doc.content || doc.content.trim() === '';
    const isSummaryEmpty = !doc.summary || doc.summary.trim() === '';
    const isSynopsisEmpty = !doc.synopsis || doc.synopsis.trim() === '';
    const isOutlineEmpty = !doc.outline || doc.outline.trim() === '';
    const isNotesEmpty = !doc.notes || doc.notes.trim() === '';
    const isOtherEmpty = !doc.other || doc.other.trim() === '';
    const isImprovementEmpty = !doc.improvement || doc.improvement.trim() === '';

    return (
      <div key={docId} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded ${
            isSelected
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-gray-50'
          }`}
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
          <div className="flex-1 min-w-0">
            <div className={`flex items-center ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${typeColor}`}>
                {typeIcon}
              </span>
              <span className="truncate">{doc.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap ml-2">
            {taskTypes.map((type) => {
              const isDisabled = (() => {
                switch (type) {
                  case 'content':
                    return isContentEmpty;
                  case 'summary':
                    return isSummaryEmpty;
                  case 'synopsis':
                    return isSynopsisEmpty;
                  case 'outline':
                    return isOutlineEmpty;
                  case 'notes':
                    return isNotesEmpty;
                  case 'other':
                    return isOtherEmpty;
                  case 'improvement':
                    return isImprovementEmpty;
                  default:
                    return false;
                }
              })();

              return (
                <button
                  key={type}
                  onClick={() => handleDocSelect(doc, type)}
                  disabled={isDisabled}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${getTaskTypeColor(type)} ${
                    isDisabled ? 'opacity-10 cursor-not-allowed' : 'hover:opacity-80'
                  }`}
                >
                  {getTaskTypeText(type)}
                </button>
              );
            })}
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
      const oldIndex = selectedDocsIdsWithType.findIndex(item => item.id === active.id);
      const newIndex = selectedDocsIdsWithType.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 创建新的数组并更新顺序
        const newOrder = arrayMove([...selectedDocsIdsWithType], oldIndex, newIndex);
        
        // 确保顺序正确后调用 onDocsChange
        onDocsChange(newOrder);
      }
    }
  };

  const getWordCount = (text: string) => {
    // 统计中文字符
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;

    // 统计英文单词
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ') // 将中文字符替换为空格
      .replace(/[^\w\s]/g, ' ') // 移除标点符号
      .split(/\s+/) // 按空格分割
      .filter(word => word.length > 0); // 过滤空字符串

    const englishCount = englishWords.length;

    // 统计标点符号
    const punctuation = text.match(/[，。！？；：""''（）【】《》]/g) || [];
    const punctuationCount = punctuation.length;

    return {
      chinese: chineseCount,
      english: englishCount,
      punctuation: punctuationCount,
      total: chineseCount + englishCount + punctuationCount
    };
  };

  const renderSelectedList = () => {
    // 计算所有已选文档的总字数
    const totalCount = selectedDocsWithType.reduce((acc, doc) => {
      const content = doc[doc.type] || '';
      const count = getWordCount(content);
      return {
        chinese: acc.chinese + count.chinese,
        english: acc.english + count.english,
        punctuation: acc.punctuation + count.punctuation,
        total: acc.total + count.total
      };
    }, { chinese: 0, english: 0, punctuation: 0, total: 0 });

    return (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedDocsIdsWithType.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {selectedDocsWithType.map(doc => (
              <SortableDocItem
                key={`${doc.id}-${doc.type}`}
                doc={doc}
                onRemove={() => {
                  const selectedItem = selectedDocsIdsWithType.find(item => item.id === doc.id);
                  if (selectedItem) {
                    handleDocSelect(doc, selectedItem.type);
                  }
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="mt-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <div className="flex justify-between">
            <span>总字数：{totalCount.total}</span>
            <span>中文：{totalCount.chinese}</span>
            <span>英文：{totalCount.english}</span>
            <span>标点：{totalCount.punctuation}</span>
          </div>
        </div>
      </>
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
        {selectedDocsWithType.length === 0 ? (
          <div className="text-center py-4 text-gray-500">请从左侧选择文档</div>
        ) : (
          <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
            {renderSelectedList()}
          </div>
        )}
      </div>
    </div>
  );
}
