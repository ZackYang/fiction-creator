import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { Type } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { DeepSeekClient } from '@/lib/deepseek';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;
    if (!projectId || !taskId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const Task = await db.tasks();

    // 检查任务是否存在
    const task = await Task.findOne({ _id: new ObjectId(taskId), projectId: new ObjectId(projectId) });
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    // 检查任务状态
    if (task.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: `Task is already ${task.status}` 
      }, { status: 400 });
    }

    const DeepSeek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY || '');

    // 更新任务状态为生成中
    await Task.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { status: 'generating', updatedAt: new Date() } }
    );

    // 触发任务执行事件
    const result = await DeepSeek.generateCompletion(task as Type.Task);

    console.log(result);

    await Task.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { status: 'completed', updatedAt: new Date(), result } }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Task execution started',
      data: { taskId }
    });
  } catch (error) {
    console.error('Error executing task:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to execute task' 
    }, { status: 500 });
  }
} 