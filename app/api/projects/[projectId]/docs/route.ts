import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { Type } from '@/lib/types';

// 文档创建验证模式
const createDocSchema = z.object({
  title: z.string().min(1, '文档标题不能为空'),
  type: z.enum(['character', 'organization', 'background', 'event', 'item', 'location', 'ability', 'spell', 'article', 'other']),
  content: z.string().optional(),
  summary: z.string().optional(),
  parentDocId: z.string().optional(),
  priority: z.number().optional(),
});

// 文档更新验证模式
const updateDocSchema = z.object({
  title: z.string().min(1, '文档标题不能为空').optional(),
  content: z.string().optional(),
});

// 获取文档列表
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projectId = (await params).projectId;
    const docs = await db.docs();
    const docList = await docs
      .find({ projectId: new ObjectId(projectId) })
      .sort({ priority: 1, updatedAt: -1 })
      .toArray();

    // 将 ObjectId 转换为字符串
    const formattedDocs = docList.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      projectId: doc.projectId?.toString() || '',
      parentDocId: doc.parentDocId?.toString(),
    }));

    return NextResponse.json(
      { 
        success: true, 
        data: formattedDocs 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch docs:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取文档列表失败' 
      },
      { status: 500 }
    );
  }
}

// 创建新文档
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const projectId = (await params).projectId;
    const body = await request.json();
    const validatedData = createDocSchema.parse(body);
    
    const docs = await db.docs();
    
    // 获取当前层级中最大的 priority
    const query: any = {
      projectId: new ObjectId(projectId)
    };
    
    if (validatedData.parentDocId) {
      query.parentDocId = new ObjectId(validatedData.parentDocId);
    } else {
      query.parentDocId = { $exists: false };
    }
    
    const maxPriorityDoc = await docs
      .find(query)
      .sort({ priority: -1 })
      .limit(1)
      .toArray();
    
    const newPriority = maxPriorityDoc.length > 0 ? (maxPriorityDoc[0].priority || 0) + 1 : 0;
    
    const docToInsert: any = {
      projectId: new ObjectId(projectId),
      title: validatedData.title,
      type: validatedData.type,
      content: validatedData.content || '',
      summary: validatedData.summary || '',
      priority: newPriority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (validatedData.parentDocId) {
      docToInsert.parentDocId = new ObjectId(validatedData.parentDocId);
    }
    
    const result = await docs.insertOne(docToInsert);

    if (!result.acknowledged) {
      return NextResponse.json(
        { 
          success: false, 
          message: '创建文档失败' 
        },
        { status: 500 }
      );
    }

    // 获取新创建的文档
    const newDoc = await docs.findOne({ _id: result.insertedId });
    if (!newDoc) {
      return NextResponse.json(
        { 
          success: false, 
          message: '获取新文档失败' 
        },
        { status: 500 }
      );
    }

    // 将 ObjectId 转换为字符串
    const formattedDoc = {
      ...newDoc,
      _id: newDoc._id.toString(),
      projectId: newDoc.projectId?.toString() || '',
      parentDocId: newDoc.parentDocId?.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: formattedDoc 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create doc:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '创建文档失败' 
      },
      { status: 500 }
    );
  }
}

// 更新文档
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const body = await request.json();
    const validatedData = updateDocSchema.parse(body);
    const { projectId } = await params;
    const docs = await db.docs();
    const result = await docs.findOneAndUpdate(
      { 
        _id: new ObjectId(body._id),
        projectId: new ObjectId(projectId)
      },
      { 
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          message: '文档不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: {
          ...result,
          _id: result._id.toString(),
          projectId: result.projectId?.toString() || '',
        }
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
    
    console.error('Failed to update doc:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '更新文档失败' 
      },
      { status: 500 }
    );
  }
}

// 删除文档
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    const projectId = (await params).projectId;
    if (!docId) {
      return NextResponse.json(
        { 
          success: false, 
          message: '文档ID不能为空' 
        },
        { status: 400 }
      );
    }

    const docs = await db.docs();
    const result = await docs.findOneAndDelete({
      _id: new ObjectId(docId),
      projectId: new ObjectId(projectId),
    });

    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          message: '文档不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '文档已删除' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete doc:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '删除文档失败' 
      },
      { status: 500 }
    );
  }
} 