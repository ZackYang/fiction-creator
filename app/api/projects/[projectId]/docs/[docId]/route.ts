import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { DOC_TYPE_LIST, Type } from '@/lib/types';

// 文档更新验证模式
const updateDocSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['character', 'organization', 'background', 'event', 'item', 'location', 'ability', 'spell', 'article', 'other', 'group']).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  improvement: z.string().optional(),
  synopsis: z.string().optional(),
  outline: z.string().optional(),
  notes: z.string().optional(),
  other: z.string().optional(),
  priority: z.number().optional(),
  parentDocId: z.string().nullable().optional(),
  taskConfig: z.object({
    relatedDocs: z.array(z.object({
      id: z.string().transform(id => new ObjectId(id)),
      type: z.enum(['content', 'summary', 'improvement', 'synopsis', 'outline', 'notes', 'other'] as const)
    })).optional(),
  }).optional(),
});

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  try {
    const { projectId, docId } = await params;
    const body = await request.json();
    const validatedData = updateDocSchema.parse(body);
    
    const docs = await db.docs();

    if (validatedData.parentDocId !== undefined) {
      const isCircular = async (currentId: string, targetId: string | null): Promise<boolean> => {
        if (!targetId) return false;
        if (currentId === targetId) return true;
        const doc = await docs.findOne({ _id: new ObjectId(targetId) });
        if (!doc?.parentDocId) return false;
        return isCircular(currentId, doc.parentDocId.toString());
      };

      if (await isCircular(docId, validatedData.parentDocId)) {
        return NextResponse.json(
          { 
            success: false, 
            message: '不能创建循环引用' 
          },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<Type.Doc> = {};
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.summary !== undefined) updateData.summary = validatedData.summary;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.parentDocId !== undefined) {
      updateData.parentDocId = validatedData.parentDocId ? new ObjectId(validatedData.parentDocId) : undefined;
    }
    if (validatedData.synopsis !== undefined) updateData.synopsis = validatedData.synopsis;
    if (validatedData.outline !== undefined) updateData.outline = validatedData.outline;
    if (validatedData.improvement !== undefined) updateData.improvement = validatedData.improvement;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.other !== undefined) updateData.other = validatedData.other;

    if (validatedData.taskConfig) {
      updateData.taskConfig = validatedData.taskConfig;
    }

    const doc = await docs.findOne({
      _id: new ObjectId(docId),
      projectId: new ObjectId(projectId),
    });

    // 如果任何内容字段有变化，则记录历史
    for (const type of DOC_TYPE_LIST) {
      if ((validatedData as any)[type] !== undefined && (validatedData as any)[type] !== (doc as any)?.[type]) {
        updateData.history = [...(doc?.history || []), {
          type: type as Type.DocType,
          content: (validatedData as any)[type] || '',
          createdAt: new Date(),
        }];
      }
    }

    const result = await docs.updateOne(
      {
        _id: new ObjectId(docId),
        projectId: new ObjectId(projectId),
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '文档不存在' 
        },
        { status: 404 }
      );
    }

    // 获取更新后的文档
    const updatedDoc = await docs.findOne({
      _id: new ObjectId(docId),
      projectId: new ObjectId(projectId),
    });

    if (!updatedDoc) {
      return NextResponse.json(
        { 
          success: false, 
          message: '获取更新后的文档失败' 
        },
        { status: 500 }
      );
    }

    // 将 ObjectId 转换为字符串
    const formattedDoc = {
      ...updatedDoc,
      _id: updatedDoc._id.toString(),
      projectId: updatedDoc.projectId?.toString() || '',
      parentDocId: updatedDoc.parentDocId?.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        data: formattedDoc,
        message: '文档更新成功'
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