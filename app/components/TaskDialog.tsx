'use client';

import { useState, useEffect } from 'react';
import { State } from '@/lib/states';
import { TASK_TYPE_LIST } from '@/lib/types';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DocSelector from './DocSelector';
import { ZH_CN } from '@/lib/zh-cn';

interface TaskDialogProps {
  projectId: string;
  docId: string;
  task?: State.Task;
  currentDoc?: State.Doc;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (task: State.Task) => void;
}

export default function TaskDialog({ 
  task,
  currentDoc,
  isOpen, 
  onClose, 
  onTaskUpdated,
}: TaskDialogProps) {
  if (!task) return null;

  const [selectedDocs, setSelectedDocs] = useState<{ id: string; type: State.TaskType }[]>(
    task.relatedDocs || []
  );
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>(
    task.relatedSummaries?.map(id => id.toString()) || []
  );
  const [selectedType, setSelectedType] = useState<State.Task['type']>(task.type);
  const [prompt, setPrompt] = useState(task.prompt || '');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(task.type);
      setPrompt(task.prompt || '');
    }
  }, [isOpen, task]);

  const getTaskTitle = () => {
    if (!currentDoc) return '编辑任务';
    if (!selectedType) return '编辑任务';
    
    const taskTypeMap: Record<State.TaskType, string> = ZH_CN.TASK_TYPE_LIST;
    
    const typeText = taskTypeMap[selectedType];
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">生成</span>
        <span className="text-gray-700">{currentDoc.title}</span>
        <span className="text-gray-500">{typeText}</span>
      </div>
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(selectedDocs);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    setSelectedDocs(reorderedItems);
  };

  const handleUpdate = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/projects/${task.projectId}/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          relatedDocs: selectedDocs,
          relatedSummaries: selectedSummaries,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update task');
      }

      toast.success('任务更新成功');
      onTaskUpdated?.(data.data);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsExecuting(false);
    }
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
            <div className="col-span-5 mb-4">
              <label className="block text-sm font-medium mb-2">任务类型</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as State.Task['type'])}
                className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {TASK_TYPE_LIST.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="w-full h-full flex">
              <div className="w-full flex h-full gap-4">
                <div className="w-2/3 flex flex-col h-full">
                  {
                    task && (
                      <DocSelector
                        projectId={task?.projectId || ''}
                        selectedDocsIdsWithType={selectedDocs}
                        onDocsChange={setSelectedDocs}
                      />
                    )
                  }
                </div>
                <div className="w-1/3 flex flex-col h-full">
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
              onClick={handleUpdate}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isExecuting ? '更新中...' : '更新任务'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 