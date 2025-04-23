import { useState, useEffect, useCallback } from 'react';
import { State } from '@/lib/states';
import DocSelector from './DocSelector';
import { Settings, X } from 'lucide-react';
import { debounce } from 'lodash';

interface TaskConfigPanelProps {
  projectId: string;
  config?: State.TaskConfig;
  onConfigChange: (config: State.TaskConfig) => void;
}

export default function TaskConfigPanel({ projectId, config, onConfigChange }: TaskConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDocsChange = (docs: string[]) => {
    console.log('handleDocsChange', docs);
    onConfigChange({
      ...config,
      relatedDocs: docs
    });
  };

  const handleSummariesChange = (summaries: string[]) => {
    console.log('handleSummariesChange', summaries);
    onConfigChange({
      ...config,
      relatedSummaries: summaries
    });
  };

  if (!isOpen) return (
    <div className="flex space-y-4 border border-gray-300 rounded-lg p-4">
      <div className="w-full flex justify-end gap-2 items-center">
        <span className="text-xs font-medium">任务配置</span>
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
      <div className="grid grid-cols-2 gap-4 h-[800px] overflow-y-auto p-4">
        <div>
          <h3 className="text-lg font-medium mb-2">相关文档</h3>
          <DocSelector
            projectId={projectId}
            selectedDocIds={config?.relatedDocs || []}
            onDocsChange={handleDocsChange}
          />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">相关摘要</h3>
          <DocSelector
            projectId={projectId}
            selectedDocIds={config?.relatedSummaries || []}
            onDocsChange={handleSummariesChange}
          />
        </div>
      </div>
    </div>
  );
}
