import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mongo';
import { ObjectId, WithId } from 'mongodb';

interface Doc {
  _id: ObjectId;
  projectId: ObjectId;
  parentDocId?: ObjectId | null;
  priority?: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { docIds, parentDocId } = await request.json();
    const projectId = (await params).projectId;
    
    if (!Array.isArray(docIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const docsCollection = await db.docs();

    // 首先验证所有文档是否存在且属于同一层级
    const docs = await docsCollection.find<Doc>({
      _id: { $in: docIds.map(id => new ObjectId(id)) },
      projectId: new ObjectId(projectId)
    }).toArray();

    console.log('Found documents:', docs.map(doc => ({
      _id: doc._id.toString(),
      parentDocId: doc.parentDocId?.toString(),
      priority: doc.priority
    })));

    if (docs.length !== docIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some documents not found' },
        { status: 404 }
      );
    }

    // 检查所有文档是否属于同一层级
    const hasParentDocId = docs.some(doc => doc.parentDocId);
    const allSameParent = docs.every(doc => 
      (hasParentDocId && doc.parentDocId?.toString() === parentDocId) || 
      (!hasParentDocId && !parentDocId)
    );

    if (!allSameParent) {
      return NextResponse.json(
        { success: false, error: 'Documents must be in the same level' },
        { status: 400 }
      );
    }

    // 更新每个文档的优先级
    const bulkOps = docIds.map((docId, index) => {
      const filter: any = {
        _id: new ObjectId(docId),
        projectId: new ObjectId(projectId)
      };

      // 对于子文档，需要匹配 parentDocId
      if (parentDocId !== undefined) {
        filter.parentDocId = parentDocId ? new ObjectId(parentDocId) : null;
      }

      console.log('Update operation:', {
        filter,
        update: { priority: index }
      });

      return {
        updateOne: {
          filter,
          update: { $set: { priority: index } }
        }
      };
    });

    const result = await docsCollection.bulkWrite(bulkOps);
    console.log('Bulk write result:', result);

    if (result.modifiedCount === docIds.length) {
      return NextResponse.json({ success: true });
    } else {
      // 尝试单独更新每个文档，找出具体哪个文档更新失败
      const failedUpdates = [];
      const updateResults = [];
      
      for (let i = 0; i < docIds.length; i++) {
        const docId = docIds[i];
        const filter: any = {
          _id: new ObjectId(docId),
          projectId: new ObjectId(projectId)
        };
        if (parentDocId !== undefined) {
          filter.parentDocId = parentDocId ? new ObjectId(parentDocId) : null;
        }

        // 先检查文档是否存在
        const doc = await docsCollection.findOne<Doc>(filter);
        console.log('Checking document:', {
          docId,
          filter,
          exists: !!doc,
          doc: doc ? {
            _id: doc._id.toString(),
            parentDocId: doc.parentDocId?.toString(),
            priority: doc.priority
          } : null
        });

        if (!doc) {
          failedUpdates.push({
            docId,
            reason: 'Document not found with given filter'
          });
          continue;
        }

        const updateResult = await docsCollection.updateOne(
          filter,
          { $set: { priority: i } }
        );
        
        updateResults.push({
          docId,
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount
        });

        if (updateResult.modifiedCount === 0) {
          failedUpdates.push({
            docId,
            reason: 'Update failed',
            matchedCount: updateResult.matchedCount
          });
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to update some documents. Modified: ${result.modifiedCount}, Expected: ${docIds.length}`,
          details: {
            docIds,
            parentDocId,
            modifiedCount: result.modifiedCount,
            failedUpdates,
            updateResults
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error reordering docs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 