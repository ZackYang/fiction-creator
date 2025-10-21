import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import { Type } from '@/lib/types';
import { z } from 'zod';
import { AI_APIS } from '@/lib/ai-apis';

// 项目更新验证模式
const updateProjectSchema = z.object({
  aiApi: z.string().refine(
    (api) => AI_APIS.some(a => a.name === api),
    { message: 'Invalid AI API' }
  ),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projects = await db.projects();
    const projectId = (await params).projectId;

    const project = await projects.findOne({ _id: new ObjectId(projectId) });

    if (!project) {
      return NextResponse.json(
        { 
          success: false, 
          message: '项目不存在' 
        },
        { status: 404 }
      );
    }

    // 将 ObjectId 转换为字符串
    const projectData = {
      ...project,
      _id: project._id.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: projectData 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取项目详情失败' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projects = await db.projects();
    const projectId = new ObjectId((await params).projectId);

    // 检查项目是否存在
    const existingProject = await projects.findOne({ _id: projectId });
    if (!existingProject) {
      return NextResponse.json(
        { 
          success: false, 
          message: '项目不存在' 
        },
        { status: 404 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { name, taskConfig } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          message: '项目名称不能为空' 
        },
        { status: 400 }
      );
    }

    // 准备更新数据
    const updateData: Partial<Type.Project> = {
      name,
      updatedAt: new Date(),
    };

    // 如果提供了 taskConfigs，则更新
    if (taskConfig) {
      updateData.taskConfig = taskConfig;
    }

    // 执行更新
    const result = await projects.updateOne(
      { _id: projectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '更新失败，项目不存在' 
        },
        { status: 404 }
      );
    }

    // 获取更新后的项目
    const updatedProject = await projects.findOne({ _id: projectId });
    if (!updatedProject) {
      return NextResponse.json(
        { success: false, message: '获取更新后的项目失败' },
        { status: 500 }
      );
    }

    // 将 ObjectId 转换为字符串
    const projectData = {
      ...updatedProject,
      _id: updatedProject._id.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: projectData,
        message: '项目更新成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '更新项目失败' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);
    
    const projects = await db.projects();
    const selectedApi = AI_APIS.find(a => a.name === validatedData.aiApi);
    if (!selectedApi) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AI API 不存在' 
        },
        { status: 400 }
      );
    }

    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          aiApi: {
            ...selectedApi,
            maxTokens: selectedApi.maxTokens || 8000,
            temperature: selectedApi.temperature || 1.2
          },
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '项目不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'AI API 更新成功'
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
    
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '更新项目失败' 
      },
      { status: 500 }
    );
  }
} 