
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface DocumentData {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; // Store as ISO string for JSON serialization
  uploaderContext: string;
}

export async function GET(request: NextRequest) {
  console.log("/api/admin/list-documents: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/list-documents: GET - Firestore Admin service not available. Admin SDK might not have initialized properly.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  // TODO: Implement proper admin authentication/authorization for this route
  // For now, it's open, relying on path obscurity or future network rules.
  // In a real app, verify an admin token here.
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ') || !isValidAdminToken(authorization.split('Bearer ')[1])) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const snapshot = await adminDb.collection('uploadedDocuments')
                                .where('uploaderContext', '==', 'admin')
                                .orderBy('uploadedAt', 'desc')
                                .get();
    
    const documents: DocumentData[] = snapshot.docs.map(doc => {
      const data = doc.data();
      let uploadedAtISO: string | null = null;
      if (data.uploadedAt && data.uploadedAt instanceof Timestamp) {
        uploadedAtISO = data.uploadedAt.toDate().toISOString();
      } else if (data.uploadedAt && typeof data.uploadedAt === 'string') {
        // If it's already a string, assume it's ISO (might happen if data isn't strictly Timestamp)
        uploadedAtISO = data.uploadedAt;
      }

      return {
        id: doc.id,
        originalFileName: data.originalFileName || "N/A",
        downloadUrl: data.downloadUrl || "#",
        contentType: data.contentType || "application/octet-stream",
        size: data.size || 0,
        uploadedAt: uploadedAtISO,
        uploaderContext: data.uploaderContext || "unknown",
      };
    });
    
    console.log(`/api/admin/list-documents: GET - Successfully fetched ${documents.length} admin-uploaded documents.`);
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching admin-uploaded documents (/api/admin/list-documents GET):', error);
    return NextResponse.json({ error: { message: 'Failed to fetch documents', details: error.message } }, { status: 500 });
  }
}

// Implement isValidAdminToken if you add token-based auth later
// async function isValidAdminToken(token: string): Promise<boolean> { ... }
