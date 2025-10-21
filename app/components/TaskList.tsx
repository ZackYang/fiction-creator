'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, AlertCircle, Loader2, Trash2, Play, Check, Eye, Pencil, Copy } from 'lucide-react';
import TaskDialog from './TaskDialog';
import { State } from '@/lib/states';
import NewTask from './NewTask';
interface TaskListProps {
  projectId: string;
  docId: string;
  refreshKey?: number;
  taskType?: State.TaskType;
}

export default function TaskList({ projectId, docId, refreshKey, taskType }: TaskListProps) {
  const [tasks, setTasks] = useState<State.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<State.Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<State.Task | null>(null);
  const [project, setProject] = useState<State.Project | null>(null);
  const [doc, setDoc] = useState<State.Doc | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchProject();
    fetchDoc();
  }, [projectId, docId, refreshKey, taskType]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks?docId=${docId}&taskType=${taskType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
      // 按创建时间降序排序
      const sortedTasks = (data.data || []).sort((a: State.Task, b: State.Task) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    const data = await response.json();
    setProject(data.data);
  }

  const fetchDoc = async () => {
    const response = await fetch(`/api/projects/${projectId}/docs/${docId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch doc');
    }
    const data = await response.json();
    setDoc(data.data);
  }

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

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResult = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResult += chunk;

        // 更新任务列表中的结果
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task._id?.toString() === taskId 
              ? { ...task, result: accumulatedResult, status: 'generating' }
              : task
          )
        );
      }

      // 最终更新任务状态为完成
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id?.toString() === taskId 
            ? { ...task, status: 'completed' }
            : task
        )
      );

      toast.success('任务执行完成');
    } catch (error) {
      console.error('Error executing task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute task');
      
      // 更新任务状态为失败
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id?.toString() === taskId 
            ? { 
                ...task, 
                status: 'failed',
                result: `Error: ${error instanceof Error ? error.message : 'Failed to execute task'}`
              }
            : task
        )
      );
    }
  };

  const handleApplyTask = async (task: State.Task) => {
    try {
      // 根据任务类型确定要更新的字段
      const updateData: any = {};
      switch (task.type) {
        case 'summary':
          updateData.summary = task.result;
          break;
        case 'synopsis':
          updateData.synopsis = task.result;
          break;
        case 'outline':
          updateData.outline = task.result;
          break;
        case 'improvement':
          updateData.improvement = task.result;
          break;
        case 'notes':
          updateData.notes = task.result;
          break;
        case 'other':
          updateData.other = task.result;
          break;
        default:
          updateData.content = task.result;
      }

      const response = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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

  const handleCopyTask = async (task: State.Task) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: task.type,
          prompt: task.prompt,
          docId: docId,
          status: 'pending',
          relatedDocs: task.relatedDocs || [],
          relatedSummaries: task.relatedSummaries || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to copy task');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to copy task');
      }

      toast.success('任务复制成功');
      fetchTasks();
    } catch (error) {
      console.error('Error copying task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to copy task');
    }
  };

  const handleEditTask = (task: State.Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
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

  return (
    <div className="flex flex-wrap gap-2">
      {tasks.map(task => (
        <div
          key={task._id?.toString() || ''}
          className="min-w-[200px] max-w-[300px] p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status || '')}
              <span className="text-sm font-medium">{getStatusText(task.status || '')}</span>
            </div>
            <div className="flex items-center gap-1">
              {task.status !== 'pending' && (
                <button
                  onClick={() => setPreviewTask(task)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="预览结果"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {task.status === 'completed' && (
                <button
                  onClick={() => handleApplyTask(task)}
                  className="p-1 text-green-500 hover:text-green-700"
                  title="应用结果"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                  onClick={() => handleExecuteTask(task._id?.toString() || '')}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  title={task.status === 'pending' ? '执行任务' : '重新执行'}
                >
                  <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditTask(task)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="编辑任务"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopyTask(task)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="复制任务"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTask(task._id?.toString() || '')}
                className="p-1 text-red-500 hover:text-red-700"
                title="删除任务"
                disabled={deletingTaskId === task._id?.toString()}
              >
                {deletingTaskId === task._id?.toString() ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {task.type === 'content' && '生成内容'}
            {task.type === 'outline' && '生成大纲'}
            {task.type === 'improvement' && '优化内容'}
            {task.type === 'summary' && '生成摘要'}
            {task.type === 'notes' && '生成笔记'}
            {task.type === 'other' && '其他'}
            {task.type === 'synopsis' && '生成梗概'}
          </div>
          {task.result && typeof task.result === 'string' && task.result.startsWith('Error:') && (
            <div className="text-sm text-red-500 mb-2">
              {task.result}
            </div>
          )}
          <div className="text-xs text-gray-400">
            {task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}
          </div>
        </div>
      ))}

      {project && (
        <NewTask
          projectId={projectId}
          docId={docId}
          taskConfig={doc?.taskConfig || project.taskConfig || {}}
          onTaskCreated={() => fetchTasks()}
          taskType={taskType}
        />
      )}

      {/* 预览弹窗 */}
      {previewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full flex flex-col container mx-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">任务结果预览</h2>
              <button
                onClick={() => setPreviewTask(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap">
                  {tasks.find(t => t._id?.toString() === previewTask._id?.toString())?.result || previewTask.result}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 任务对话框 */}
      {selectedTask && (
        <TaskDialog
          projectId={projectId}
          docId={docId}
          isOpen={isTaskDialogOpen}
          task={selectedTask}
          currentDoc={doc || undefined}
          onClose={() => {
            setIsTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={(task: State.Task) => {
            setIsTaskDialogOpen(false);
            setSelectedTask(task);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
