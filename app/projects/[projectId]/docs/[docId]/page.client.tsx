'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Type } from '@/lib/types';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

export default function DocEditor() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const docId = params.docId as string;
  const [doc, setDoc] = useState<Type.Doc | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Type.DocType>('other');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDoc();
  }, [projectId, docId]);

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
      setTitle(data.data.title);
      setType(data.data.type);
      setContent(data.data.content || '');
      setSummary(data.data.summary || '');
      setPriority(data.data.priority || 0);
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

      toast.success('Document saved successfully');
      
      // 触发文档列表刷新
      const event = new CustomEvent('refreshDocs');
      window.dispatchEvent(event);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑文档</h1>
        <div className="space-x-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            删除
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Type.DocType)}
            className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="character">Character</option>
            <option value="organization">Organization</option>
            <option value="background">Background</option>
            <option value="event">Event</option>
            <option value="item">Item</option>
            <option value="location">Location</option>
            <option value="ability">Ability</option>
            <option value="spell">Spell</option>
            <option value="article">Article</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
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
          <label className="block text-sm font-medium mb-1">摘要</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full h-32 p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">优先级</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="text-sm text-gray-500">
          <p>创建时间: {new Date(doc.createdAt).toLocaleString()}</p>
          <p>最后更新: {new Date(doc.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 