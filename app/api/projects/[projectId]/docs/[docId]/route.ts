import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  try {
    const { projectId, docId } = await params;
    const docs = await db.docs();
    const doc = await docs.findOne({
      _id: new ObjectId(docId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) {
      return NextResponse.json(
        { 
          success: false, 
          message: '文档不存在' 
        },
        { status: 404 }
      );
    }

    // 将 ObjectId 转换为字符串
    const formattedDoc = {
      ...doc,
      _id: doc._id.toString(),
      projectId: doc.projectId?.toString() || '',
      parentDocId: doc.parentDocId?.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: formattedDoc 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch doc:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取文档失败' 
      },
      { status: 500 }
    );
  }
} 