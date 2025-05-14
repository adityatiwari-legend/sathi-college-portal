
import { NextRequest, NextResponse } from 'next/server';
import adminInstance, { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  if (!adminInstance || !adminDb || !adminStorage) {
    console.error('Firebase Admin SDK not initialized properly. adminInstance, adminDb, or adminStorage is null/undefined.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized properly.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderContext = formData.get('uploaderContext') as string || 'unknown'; // 'admin' or 'user'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    
    // Use a path based on uploaderContext or a general path
    const basePath = uploaderContext === 'admin' ? 'admin_uploads' : 'user_uploads';
    const fileNameInStorage = `${basePath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    const fileUpload = bucket.file(fileNameInStorage);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        console.error('Error uploading to Firebase Storage:', err);
        reject(err);
      });
      stream.on('finish', resolve);
      stream.end(fileBuffer);
    });

    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // A far future date
    });

    const docRef = await adminDb.collection('uploadedDocuments').add({
      uploaderContext: uploaderContext, // Store the context (admin/user)
      originalFileName: file.name,
      storagePath: fileNameInStorage,
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: docRef.id,
      downloadUrl: url,
    });
  } catch (error) {
    console.error('Error processing file upload (API Route):', error);
    // Check if error is an instance of Error to access message property safely
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file due to an internal server error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

