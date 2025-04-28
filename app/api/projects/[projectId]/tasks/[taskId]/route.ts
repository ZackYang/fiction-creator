import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// 任务更新验证模式
const updateTaskSchema = z.object({
  type: z.enum(['content', 'summary', 'outline', 'notes', 'other', 'synopsis', 'improvement']).optional(),
  relatedDocs: z.array(z.object({
    id: z.string().transform(id => new ObjectId(id)),
    type: z.enum(['content', 'summary', 'improvement', 'synopsis', 'outline', 'notes', 'other'] as const)
  })).optional(),
  prompt: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);
    
    const tasks = await db.tasks();
    const result = await tasks.updateOne(
      {
        _id: new ObjectId(taskId),
        projectId: new ObjectId(projectId),
      },
      {
        $set: {
          updatedAt: new Date(),
          ...validatedData,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '任务不存在' 
        },
        { status: 404 }
      );
    }

    // 获取更新后的任务
    const updatedTask = await tasks.findOne({
      _id: new ObjectId(taskId),
      projectId: new ObjectId(projectId),
    });

    if (!updatedTask) {
      return NextResponse.json(
        { 
          success: false, 
          message: '获取更新后的任务失败' 
        },
        { status: 500 }
      );
    }

    // 将 ObjectId 转换为字符串
    const formattedTask = {
      ...updatedTask,
      _id: updatedTask._id.toString(),
      projectId: updatedTask.projectId?.toString() || '',
      docId: updatedTask.docId?.toString(),
      relatedDocs: updatedTask.relatedDocs?.map(doc => ({
        id: doc.id.toString(),
        type: doc.type
      })) || []
    };

    return NextResponse.json(
      { 
        success: true, 
        data: formattedTask,
        message: '任务更新成功'
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: '数据验证失败',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '更新任务失败' 
      },
      { status: 500 }
    );
  }
} 