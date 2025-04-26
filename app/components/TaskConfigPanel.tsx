'use client';

import { useState, useEffect, useCallback } from 'react';
import { State } from '@/lib/states';
import DocSelector from './DocSelector';
import { Settings, X } from 'lucide-react';
import { getTaskTypeColor, getTaskTypeText } from './DocSelector';
interface TaskConfigPanelProps {
  projectId: string;
  config?: State.TaskConfig;
  onConfigChange: (config: State.TaskConfig) => void;
}

export default function TaskConfigPanel({ projectId, config, onConfigChange }: TaskConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [docs, setDocs] = useState<State.Doc[]>([]);

  const handleDocsChange = (docs: { id: string; type: State.TaskType }[]) => {
    console.log('handleDocsChange', docs);
    onConfigChange({
      ...config,
      relatedDocs: docs
    });
  };

  const fetchDocs = async () => {
    const response = await fetch(`/api/projects/${projectId}/docs`);
    const data = await response.json();
    setDocs(data.data);
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  const relatedDocsWithTitleAndType = config?.relatedDocs?.map(doc => ({
    ...doc,
    title: docs.find(d => d._id === doc.id)?.title || '',
    type: doc.type
  }));

  if (!isOpen) return (
    <div className="flex space-y-4 border border-gray-300 rounded-lg p-4">
      <div className="w-full flex gap-2 flex-wrap">
        {
          relatedDocsWithTitleAndType?.map(doc => (
            <span className={`items-center gap-2 ${getTaskTypeColor(doc.type as State.TaskType)} text-sm flex items-center gap-2 border border-gray-300 rounded-lg p-1`} key={doc.id}>
              <span>{doc.title}</span>
              <span>{getTaskTypeText(doc.type as State.TaskType)}</span>
            </span>
          ))
        }
      </div>
      <div className="w-full flex justify-end gap-2 items-center flex-1">
        <button 
          onClick={() => onConfigChange({ ...config, relatedDocs: [] })}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
        >
          清空
        </button>
        <button onClick={() => setIsOpen(true)}>
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 border border-gray-300 rounded-lg relative">
      {/* 顶部按钮 */}
      <div className="top-0 right-0 flex justify-end items-end w-full bg-blue-200 p-2 rounded-t-lg">
        <button onClick={() => setIsOpen(false)} className="cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 h-[800px] overflow-y-auto p-4">
        <div>
          <h3 className="text-lg font-medium mb-2">相关文档</h3>
          <DocSelector
            projectId={projectId}
            selectedDocsIdsWithType={config?.relatedDocs || []}
            onDocsChange={handleDocsChange}
          />
        </div>
      </div>
    </div>
  );
}
