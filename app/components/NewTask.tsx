import { useState } from 'react';
import { State } from '@/lib/states';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface NewTaskProps {
  projectId: string;
  docId?: string;
  taskConfig: State.TaskConfig;
  onTaskCreated?: () => void;
  taskType?: State.TaskType;
}

export default function NewTask({ projectId, docId, taskConfig, onTaskCreated, taskType }: NewTaskProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!projectId) {
      toast.error('项目ID不能为空');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docId,
          type: taskType || 'content', // 默认创建内容生成任务
          relatedDocs: taskConfig.relatedDocs || [],
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '创建任务失败');
      }

      toast.success('任务创建成功');
      onTaskCreated?.();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error instanceof Error ? error.message : '创建任务失败');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateTask}
      disabled={isCreating || !projectId}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      <Plus className="w-4 h-4" />
      <span>{isCreating ? '创建中...' : '新建任务'}</span>
    </button>
  );
} 