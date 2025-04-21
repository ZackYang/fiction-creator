'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Doc {
  _id: string;
  projectId: string;
  title: string;
  content?: string;
  parentDocId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DocEditor({ docId, projectId }: { docId: string, projectId: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/docs/${docId}`);
        const data = await response.json();
        if (data.success) {
          setDoc(data.data);
        } else {
          toast.error(data.message || '获取文档失败');
        }
      } catch (error) {
        console.error('Failed to fetch doc:', error);
        toast.error('获取文档失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [docId, projectId]);

  const handleSave = async () => {
    if (!doc) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/docs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: doc._id,
          title: doc.title,
          content: doc.content,
          parentDocId: doc.parentDocId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('文档已保存');
        setDoc(data.data);
      } else {
        toast.error(data.message || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save doc:', error);
      toast.error('保存失败');
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
            value={doc.title}
            onChange={(e) => setDoc({ ...doc, title: e.target.value })}
            className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">内容</label>
          <textarea
            value={doc.content || ''}
            onChange={(e) => setDoc({ ...doc, content: e.target.value })}
            className="w-full h-96 p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">父文档 ID</label>
          <input
            type="text"
            value={doc.parentDocId || ''}
            onChange={(e) => setDoc({ ...doc, parentDocId: e.target.value || undefined })}
            className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="留空表示没有父文档"
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