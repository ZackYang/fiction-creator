import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projects = await db.projects();
    const project = await projects.findOne({ _id: new ObjectId(params.projectId) });

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