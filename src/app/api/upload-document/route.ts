
import { NextRequest, NextResponse } from 'next/server';
import adminInstance, { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  console.log('/api/upload-document: POST request received.');

  if (!adminInstance || !adminDb || !adminStorage) {
    console.error('/api/upload-document: Firebase Admin SDK not initialized properly. adminInstance, adminDb, or adminStorage is null/undefined.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized properly. Check server logs for details.' }, { status: 500 });
  }
  console.log('/api/upload-document: Firebase Admin SDK instances seem available.');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderContext = formData.get('uploaderContext') as string || 'unknown'; 

    if (!file) {
      console.log('/api/upload-document: No file provided in formData.');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log(`/api/upload-document: File received: ${file.name}, size: ${file.size}, type: ${file.type}, context: ${uploaderContext}`);

    const bucket = adminStorage.bucket();
    console.log(`/api/upload-document: Using storage bucket: ${bucket.name}`);
    
    const basePath = uploaderContext === 'admin' ? 'admin_uploads' : 'user_uploads';
    const fileNameInStorage = `${basePath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    console.log(`/api/upload-document: Target storage path: ${fileNameInStorage}`);
    
    const fileUpload = bucket.file(fileNameInStorage);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`/api/upload-document: File buffer created, length: ${fileBuffer.length}`);

    await new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        console.error('/api/upload-document: Error during Firebase Storage stream upload:', err);
        reject(err);
      });
      stream.on('finish', () => {
        console.log('/api/upload-document: Firebase Storage stream finished successfully.');
        resolve(true);
      });
      stream.end(fileBuffer);
    });

    console.log('/api/upload-document: File uploaded to Firebase Storage. Getting signed URL...');
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', 
    });
    console.log(`/api/upload-document: Signed URL obtained: ${url}`);

    console.log('/api/upload-document: Adding document metadata to Firestore collection "uploadedDocuments"...');
    const docRef = await adminDb.collection('uploadedDocuments').add({
      uploaderContext: uploaderContext,
      originalFileName: file.name,
      storagePath: fileNameInStorage,
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
    });
    console.log(`/api/upload-document: Firestore document created with ID: ${docRef.id}`);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: docRef.id,
      downloadUrl: url,
    });

  } catch (error) {
    console.error('/api/upload-document: Critical error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file due to an unexpected internal server error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
