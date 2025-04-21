import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/mongo';

// 定义项目创建请求的验证模式
const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
});

// 获取项目列表
export async function GET() {
  try {
    const projects = await db.projects();
    const projectList = await projects.find({}).toArray();
    
    return NextResponse.json(
      { 
        success: true, 
        data: projectList 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: '获取项目列表失败' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validatedData = createProjectSchema.parse(body);
    const project = await db.projects();
    await project.insertOne(validatedData);
    
    // 目前只是返回成功响应
    return NextResponse.json(
      { 
        success: true, 
        message: '项目创建成功',
        data: validatedData 
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
    
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
} 