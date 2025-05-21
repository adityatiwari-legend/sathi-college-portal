
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { Timestamp } from 'firebase-admin/firestore';

interface TimetableData {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; 
  uploaderContext: string;
  storagePath: string; 
}

export async function GET(request: NextRequest) {
  console.log("/api/admin/list-timetables: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/list-timetables: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection('uploadedDocuments')
                                .where('uploaderContext', '==', 'timetable')
                                .orderBy('uploadedAt', 'desc')
                                .get();
    
    const timetables: TimetableData[] = snapshot.docs.map(doc => {
      const data = doc.data();
      let uploadedAtISO: string | null = null;
      if (data.uploadedAt && data.uploadedAt instanceof Timestamp) {
        uploadedAtISO = data.uploadedAt.toDate().toISOString();
      } else if (data.uploadedAt && typeof data.uploadedAt === 'string') {
        uploadedAtISO = data.uploadedAt;
      }

      return {
        id: doc.id,
        originalFileName: data.originalFileName || "N/A",
        downloadUrl: data.downloadUrl || "#",
        contentType: data.contentType || "application/pdf",
        size: data.size || 0,
        uploadedAt: uploadedAtISO,
        uploaderContext: data.uploaderContext || "timetable",
        storagePath: data.storagePath || "", // Ensure storagePath is returned
      };
    });
    
    console.log(`/api/admin/list-timetables: GET - Successfully fetched ${timetables.length} timetables.`);
    return NextResponse.json(timetables);
  } catch (error: any) {
    console.error('Error fetching timetables (/api/admin/list-timetables GET):', error);
    return NextResponse.json({ error: { message: 'Failed to fetch timetables', details: error.message } }, { status: 500 });
  }
}
