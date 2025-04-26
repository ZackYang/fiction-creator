import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { Type } from '@/lib/types';
import { State } from '@/lib/states';
// 任务创建验证模式
const createTaskSchema = z.object({
  docId: z.string().min(1, '文档ID不能为空'),
  type: z.enum(['content', 'summary', 'outline', 'improvement', 'notes', 'other', 'synopsis']),
  relatedDocs: z.array(z.object({
    id: z.string().min(1, '文档ID不能为空'),
    type: z.enum(['content', 'summary', 'outline', 'improvement', 'notes', 'other', 'synopsis'])
  })),
  prompt: z.string().optional()
});

// 创建新任务
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projectId = (await params).projectId;
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);
    
    const tasks = await db.tasks();
    
    // 创建新任务
    const taskToInsert: Type.Task = {
      _id: new ObjectId(),
      projectId: new ObjectId(projectId),
      docId: new ObjectId(validatedData.docId),
      type: validatedData.type as State.TaskType,
      status: 'pending',
      relatedDocs: validatedData.relatedDocs.map(doc => ({ id: new ObjectId(doc.id), type: doc.type as State.TaskType })),
      prompt: validatedData.prompt || '',
      result: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await tasks.insertOne(taskToInsert);

    if (!result.acknowledged) {
      return NextResponse.json(
        { 
          success: false, 
          message: '创建任务失败' 
        },
        { status: 500 }
      );
    }

    // 获取新创建的任务
    const newTask = await tasks.findOne({ _id: result.insertedId });
    if (!newTask) {
      return NextResponse.json(
        { 
          success: false, 
          message: '获取新任务失败' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: newTask 
      },
      { status: 201 }
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
    
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '创建任务失败' 
      },
      { status: 500 }
    );
  }
}

// 获取任务列表
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projectId = (await params).projectId;
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    const taskType = searchParams.get('taskType');
    const tasks = await db.tasks();
    const query: any = {
      projectId: new ObjectId(projectId)
    };
    
    if (docId) {
      query.docId = new ObjectId(docId);
    }

    if (taskType) {
      query.type = taskType as State.TaskType;
    }
    
    const taskList = await tasks
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();


    return NextResponse.json(
      { 
        success: true, 
        data: taskList 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取任务列表失败' 
      },
      { status: 500 }
    );
  }
}

// 删除任务
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projectId = (await params).projectId;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { 
          success: false, 
          message: '任务ID不能为空' 
        },
        { status: 400 }
      );
    }
    
    const tasks = await db.tasks();
    const result = await tasks.deleteOne({ 
      _id: new ObjectId(taskId),
      projectId: new ObjectId(projectId)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '任务不存在或已被删除' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: '任务删除成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '删除任务失败' 
      },
      { status: 500 }
    );
  }
} 