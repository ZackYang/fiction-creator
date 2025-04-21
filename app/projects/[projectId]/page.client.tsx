'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Project {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProjectEditor({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (data.success) {
          setProject(data.data);
          setName(data.data.name);
          setDescription(data.data.description || '');
        } else {
          toast.error('获取项目信息失败');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('获取项目信息失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('项目名称不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('项目已更新');
        router.refresh();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">项目不存在</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            项目名称
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            项目描述
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
} 