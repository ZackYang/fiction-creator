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

    const Project = await db.projects();

    // 检查任务是否存在
    const task = await Task.findOne({ _id: new ObjectId(taskId), projectId: new ObjectId(projectId) });
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    const project = await Project.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    const aiApi = project.aiApi;
    const DeepSeek = new DeepSeekClient();

    // aiApi 不存在
    if (!aiApi) {
      return NextResponse.json({ success: false, message: 'AI API not found' }, { status: 404 });
    }

    // 更新任务状态为生成中
    await Task.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { status: 'generating', updatedAt: new Date() } }
    );

    // 创建流式响应
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // 开始生成内容
    DeepSeek.generateCompletion(task as Type.Task, async (chunk) => {
      try {
        // 将新的内容块写入流
        await writer.write(encoder.encode(chunk));
        
        // 更新任务结果
        await Task.updateOne(
          { _id: new ObjectId(taskId) },
          { 
            $set: { 
              result: chunk,
              updatedAt: new Date()
            }
          }
        );
      } catch (error) {
        console.error('Error writing chunk:', error);
      }
    }, aiApi).then(async (finalResult) => {
      try {
        // 更新最终状态
        await Task.updateOne(
          { _id: new ObjectId(taskId) },
          { 
            $set: { 
              status: 'completed',
              result: finalResult,
              updatedAt: new Date()
            }
          }
        );
        
        // 关闭流
        await writer.close();
      } catch (error) {
        console.error('Error finalizing task:', error);
        await writer.abort(error);
      }
    }).catch(async (error) => {
      console.error('Error generating completion:', error);
      // 更新任务状态为失败
      await Task.updateOne(
        { _id: new ObjectId(taskId) },
        { 
          $set: { 
            status: 'failed',
            result: `Error: ${error instanceof Error ? error.message : 'Failed to generate completion'}`,
            updatedAt: new Date()
          }
        }
      );
      await writer.abort(error);
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error executing task:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to execute task' 
    }, { status: 500 });
  }
} 