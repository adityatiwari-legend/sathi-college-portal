
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage, getAdminApp } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH

export async function POST(request: NextRequest) {
  console.log("/api/admin/delete-document: POST request received");
  const adminApp = getAdminApp();
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  if (!adminApp || !adminDb || !adminStorage) {
    console.error('/api/admin/delete-document: Firebase Admin SDK services not fully available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized correctly.' } }, { status: 500 });
  }
  
  // TODO: Implement proper admin authentication/authorization for this route
  // For now, it's open, relying on path obscurity or future network rules.

  try {
    const { documentId, storagePath, collectionName = 'uploadedDocuments' } = await request.json();
    console.log("/api/admin/delete-document: Request body:", { documentId, storagePath, collectionName });

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: { message: 'documentId is missing or invalid.' } }, { status: 400 });
    }
    if (!storagePath || typeof storagePath !== 'string') {
      // Log this, but still attempt Firestore delete if storagePath is missing for some reason
      console.warn(`/api/admin/delete-document: storagePath is missing for documentId ${documentId}. Will only attempt Firestore deletion.`);
    }
    if (!collectionName || typeof collectionName !== 'string') {
      return NextResponse.json({ error: { message: 'collectionName is missing or invalid.' } }, { status: 400 });
    }


    // Delete from Firebase Storage if storagePath is provided
    if (storagePath) {
      try {
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${adminApp.options.projectId}.appspot.com`;
        const bucket = adminStorage.bucket(bucketName);
        const file = bucket.file(storagePath);
        await file.delete();
        console.log(`/api/admin/delete-document: Successfully deleted from Storage: ${storagePath}`);
      } catch (storageError: any) {
        // Log error but don't necessarily fail the whole operation if Firestore delete can still proceed
        // This could happen if the file was already deleted or path was incorrect
        console.warn(`/api/admin/delete-document: Failed to delete from Storage (path: ${storagePath}):`, storageError.message);
        // If it's a critical error like permissions, you might want to rethrow or handle differently
      }
    }

    // Delete from Firestore
    await adminDb.collection(collectionName).doc(documentId).delete();
    console.log(`/api/admin/delete-document: Successfully deleted from Firestore (collection: ${collectionName}, id: ${documentId})`);

    return NextResponse.json({ message: 'Document deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting document (/api/admin/delete-document POST):', error);
    return NextResponse.json({ error: { message: 'Failed to delete document', details: error.message } }, { status: 500 });
  }
}
