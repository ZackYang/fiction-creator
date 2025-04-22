'use client';

import { useState, useEffect } from 'react';
import { State } from '@/lib/states';
import { Type } from '@/lib/types';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface TaskDialogProps {
  projectId: string;
  docId: string;
  type?: 'content' | 'summary' | 'outline' | 'improve';
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  relatedDocs?: string[];
  relatedSummaries?: string[];
  defaultPrompt?: string;
}

interface DocWithChildren extends State.Doc {
  children?: DocWithChildren[];
  parentDocId?: string;
  type?: string;
  content?: string;
  summary?: string;
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

export default function TaskDialog({ 
  projectId, 
  docId, 
  type, 
  isOpen, 
  onClose, 
  onTaskCreated,
  relatedDocs = [],
  relatedSummaries = [],
  defaultPrompt = ''
}: TaskDialogProps) {
  const [docs, setDocs] = useState<State.Doc[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(relatedDocs);
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>(relatedSummaries);
  const [selectedType, setSelectedType] = useState<Type.Task['type']>(type || 'content');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<State.Doc | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
      fetchCurrentDoc();
      setSelectedDocs(relatedDocs);
      setSelectedSummaries(relatedSummaries);
    }
  }, [isOpen]);

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

  const fetchCurrentDoc = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs/${docId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current document');
      }
      const data = await response.json();
      if (data.success) {
        setCurrentDoc(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch current document:', error);
    }
  };

  const getTaskTitle = () => {
    if (!currentDoc) return '创建任务';
    
    const typeText = selectedType === 'content' ? '生成' : 
                    selectedType === 'summary' ? '摘要' : 
                    selectedType === 'outline' ? '大纲' :
                    selectedType === 'improve' ? '优化' :
                    '生成';
    
    return `${typeText} ${currentDoc.title}`;
  };

  const handleDocSelect = (docId: string) => {
    setSelectedDocs(prev => {
      const newSelected = prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId];
      return newSelected;
    });
  };

  const handleSummarySelect = (docId: string) => {
    setSelectedSummaries(prev => {
      const newSelected = prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId];
      return newSelected;
    });
  };

  const handleExecute = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          docId,
          type: selectedType,
          prompt,
          relatedDocs: selectedDocs,
          relatedSummaries: selectedSummaries,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create task');
      }

      toast.success('任务创建成功');
      onClose();
      onTaskCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const isSummary = result.destination.droppableId === 'summary-list';
    const items = isSummary ? selectedSummaries : selectedDocs;
    const setItems = isSummary ? setSelectedSummaries : setSelectedDocs;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };

  const renderSelectedList = (items: string[], isSummary: boolean) => {
    return (
      <Droppable 
        droppableId={isSummary ? 'summary-list' : 'doc-list'} 
        isDropDisabled={false}
        isCombineEnabled={false}
        direction="vertical"
        ignoreContainerClipping={false}
        type="DEFAULT"
      >
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-1 h-[60vh] overflow-y-auto border rounded p-2 bg-white ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {items.map((docId, index) => {
              // 在 docs 数组中查找文档
              const findDoc = (docs: DocWithChildren[]): DocWithChildren | undefined => {
                for (const doc of docs) {
                  if (doc.id === docId) return doc;
                  if (doc.children) {
                    const found = findDoc(doc.children);
                    if (found) return found;
                  }
                }
                return undefined;
              };
              
              const doc = findDoc(docs);
              if (!doc) return null;
              
              return (
                <Draggable 
                  key={docId} 
                  draggableId={docId} 
                  index={index}
                  isDragDisabled={false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-2 p-2 rounded ${
                        snapshot.isDragging ? 'bg-blue-50 shadow-md' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1 truncate">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${getDocTypeColor(doc.type || 'other')}`}>
                          {getDocTypeIcon(doc.type || 'other')}
                        </span>
                        {doc.title}
                      </div>
                      <button
                        onClick={() => {
                          if (isSummary) {
                            setSelectedSummaries(prev => prev.filter(id => id !== docId));
                          } else {
                            setSelectedDocs(prev => prev.filter(id => id !== docId));
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  const renderDocItem = (doc: DocWithChildren, level: number = 0, isSummaryList: boolean = false) => {
    const isSelected = isSummaryList ? selectedSummaries.includes(doc.id!) : selectedDocs.includes(doc.id!);
    const hasChildren = doc.children && doc.children.length > 0;
    const typeColor = getDocTypeColor(doc.type || 'other');
    const typeIcon = getDocTypeIcon(doc.type || 'other');
    const missingContent = !doc.content || doc.content.trim() === '';
    const missingSummary = !doc.summary || doc.summary.trim() === '';
    const isCurrentDoc = doc.id === docId;

    return (
      <div key={doc.id!} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded ${
            isCurrentDoc 
              ? 'bg-gray-100 cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-50'
          } ${
            isSelected
              ? 'bg-blue-50 border border-blue-200'
              : ''
          }`}
          onClick={() => {
            if (isCurrentDoc) return;
            if (isSummaryList) {
              handleSummarySelect(doc.id!);
            } else {
              handleDocSelect(doc.id!);
            }
          }}
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
        {hasChildren && doc.children?.map(child => renderDocItem(child, level + 1, isSummaryList))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{getTaskTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-5 gap-4 h-full">
              <div className="col-span-5 mb-4">
                <label className="block text-sm font-medium mb-2">任务类型</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as Type.Task['type'])}
                  className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="content">生成内容</option>
                  <option value="summary">生成摘要</option>
                  <option value="outline">生成大纲</option>
                  <option value="improve">优化内容</option>
                </select>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-4">
                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium mb-2">相关文档</label>
                  {isLoading ? (
                    <div className="text-center py-4">加载文档中...</div>
                  ) : docs.length === 0 ? (
                    <div className="text-center py-4">暂无文档</div>
                  ) : (
                    <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
                      {docs.map(doc => renderDocItem(doc, 0, false))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium mb-2">已选文档</label>
                  {selectedDocs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">请从左侧选择文档</div>
                  ) : (
                    <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
                      {renderSelectedList(selectedDocs, false)}
                    </div>
                  )}
                </div>

                <>
                  <div className="flex flex-col h-full">
                    <label className="block text-sm font-medium mb-2">相关摘要</label>
                    {isLoading ? (
                      <div className="text-center py-4">加载摘要中...</div>
                    ) : docs.length === 0 ? (
                      <div className="text-center py-4">暂无摘要</div>
                    ) : (
                      <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
                        {docs.map(doc => renderDocItem(doc, 0, true))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col h-full">
                    <label className="block text-sm font-medium mb-2">已选摘要</label>
                    {selectedSummaries.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">请从左侧选择摘要</div>
                    ) : (
                      <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
                        {renderSelectedList(selectedSummaries, true)}
                      </div>
                    )}
                  </div>
                </>
              </div>

              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium mb-2">Prompt</label>
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入任务提示..."
                    className="flex-1 w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    <p>提示：</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>可以输入具体的任务要求</li>
                      <li>可以指定生成内容的风格</li>
                      <li>可以添加特殊指令</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </DragDropContext>
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isExecuting ? '创建中...' : '创建任务'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 