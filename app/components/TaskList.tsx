'use client';

import { useState, useEffect } from 'react';
import { Type } from '@/lib/types';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, AlertCircle, Loader2, Trash2, Play, Check } from 'lucide-react';

interface TaskListProps {
  projectId: string;
  docId: string;
  refreshKey?: number;
}

export default function TaskList({ projectId, docId, refreshKey }: TaskListProps) {
  const [tasks, setTasks] = useState<Type.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId, docId, refreshKey]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks?docId=${docId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
      // 按创建时间降序排序
      const sortedTasks = (data.data || []).sort((a: Type.Task, b: Type.Task) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    
    setDeletingTaskId(taskId);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete task');
      }

      toast.success('任务删除成功');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute task');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to execute task');
      }

      toast.success('任务开始执行');
      fetchTasks();
    } catch (error) {
      console.error('Error executing task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute task');
    }
  };

  const handleApplyTask = async (task: Type.Task) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [task.type === 'summary' ? 'summary' : 'content']: task.result,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply task result');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to apply task result');
      }

      toast.success('任务结果已应用');
      // 触发文档刷新事件
      const event = new CustomEvent('refreshDoc');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error applying task result:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply task result');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'generating':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="py-3">
        <h3 className="text-sm font-medium text-gray-500 mb-2">任务列表</h3>
        <div className="flex flex-wrap gap-2 justify-start">
          {tasks.map((task) => (
            <div
              key={task._id.toString()}
              className="flex items-center justify-between p-2 bg-gray-50 rounded min-w-[200px] max-w-[300px]"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getStatusIcon(task.status)}
                <span className="text-sm font-medium truncate">
                  {task.type === 'content' ? '生成内容' :
                   task.type === 'summary' ? '生成摘要' :
                   task.type === 'outline' ? '生成大纲' :
                   '优化内容'}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {getStatusText(task.status)}
                </span>
                {task.result && task.result.startsWith('Error:') && (
                  <span className="text-sm text-red-500" title={task.result}>
                    <AlertCircle className="w-4 h-4" />
                  </span>
                )}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleExecuteTask(task._id.toString())}
                    className="text-gray-400 hover:text-green-500"
                    title="执行任务"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                {task.status === 'completed' && task.result && !task.result.startsWith('Error:') && (
                  <button
                    onClick={() => handleApplyTask(task)}
                    className="text-gray-400 hover:text-blue-500"
                    title="应用结果"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task._id.toString())}
                  disabled={deletingTaskId === task._id.toString()}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50 flex-shrink-0"
                >
                  {deletingTaskId === task._id.toString() ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 