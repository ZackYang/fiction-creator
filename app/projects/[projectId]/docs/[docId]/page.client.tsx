'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { State } from '@/lib/states';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import TaskList from '@/app/components/TaskList';
import TaskConfigPanel from '@/app/components/TaskConfigPanel';
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

export default function DocEditor({ projectId, docId }: { projectId: string; docId: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<State.Doc | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<State.DocType>('other');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [taskConfig, setTaskConfig] = useState<State.TaskConfig>({
    relatedDocs: [],
    relatedSummaries: []
  });

  useEffect(() => {
    fetchDoc();
  }, [projectId, docId]);

  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [content, summary, taskConfig]);

  const fetchDoc = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/docs/${docId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doc');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doc');
      }
      setDoc(data.data);
      setTitle(data.data.title || '');
      setType(data.data.type || 'other');
      setContent(data.data.content || '');
      setSummary(data.data.summary || '');
      setPriority(data.data.priority || 0);
      setTaskConfig({
        relatedDocs: data.data.taskConfig?.relatedDocs || [],
        relatedSummaries: data.data.taskConfig?.relatedSummaries || []
      });
    } catch (error) {
      console.error('Error fetching doc:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doc) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          type,
          content,
          summary,
          priority,
          taskConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save doc');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save doc');
      }

      setLastSaved(new Date());
      toast.success('Document saved successfully');
      
      // 触发文档列表刷新
      const event = new CustomEvent('refreshDocs');
      window.dispatchEvent(event);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving doc:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/docs?docId=${doc._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('文档已删除');
        router.push(`/projects/${projectId}`);
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete doc:', error);
      toast.error('删除失败');
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

    return {
      chinese: chineseCount,
      english: englishCount,
      total: chineseCount + englishCount
    };
  };

  const handleConfigChange = (config: State.TaskConfig) => {
    console.log('handleConfigChange', config);

    setTaskConfig({
      relatedDocs: config.relatedDocs || [],
      relatedSummaries: config.relatedSummaries || []
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>文档不存在或已被删除</p>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            返回项目
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {doc.title || '未命名文档'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
                {lastSaved && !isSaving && (
                  <span className="text-xs text-green-200">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">类型</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as State.DocType)}
                  className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="article">文章</option>
                  <option value="character">角色</option>
                  <option value="organization">组织</option>
                  <option value="location">地点</option>
                  <option value="item">物品</option>
                  <option value="event">事件</option>
                  <option value="background">背景</option>
                  <option value="ability">能力</option>
                  <option value="spell">法术</option>
                  <option value="article">文章</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">优先级</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <TaskList projectId={projectId} docId={docId} refreshKey={refreshKey} />
            <TaskConfigPanel projectId={projectId} config={taskConfig} onConfigChange={handleConfigChange} />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">内容</label>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>中文字数: {getWordCount(content).chinese}</span>
                  <span>|</span>
                  <span>英文单词: {getWordCount(content).english}</span>
                  <span>|</span>
                  <span>总计: {getWordCount(content).total}</span>
                </div>
              </div>
              <div className="border border-gray-300 rounded overflow-hidden">
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  height={500}
                  preview="live"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">摘要</label>
              </div>
              <div
                className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <MDEditor
                  value={summary}
                  onChange={(value) => setSummary(value || '')}
                  height={300}
                  preview="live"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>创建时间: {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}</p>
              <p>最后更新: {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}