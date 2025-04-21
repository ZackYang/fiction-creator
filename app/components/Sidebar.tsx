'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  description?: string;
}

export default function Sidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowDialog(false);
        setNewProjectName('');
        fetchProjects(); // 刷新项目列表
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">Projects</h2>
        <button
          onClick={() => setShowDialog(true)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          title="Create new project"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project._id}>
                <Link
                  href={`/projects/${project._id}`}
                  className="block p-2 rounded hover:bg-gray-700 transition-colors"
                >
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 新建项目对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setNewProjectName('');
                }}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 