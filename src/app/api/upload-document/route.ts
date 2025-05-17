
import { NextRequest, NextResponse } from 'next/server';
import adminInstance, { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try { // Outermost try-catch to ensure a JSON response is always attempted
    console.log('/api/upload-document: POST request received.');

    if (!adminInstance) {
      console.error('/api/upload-document: CRITICAL - adminInstance is null. Firebase Admin SDK did not initialize.');
      return NextResponse.json({ error: 'Firebase Admin SDK failed to initialize. Check server logs for details on admin.ts initialization process.' }, { status: 500 });
    }
    if (!adminDb) {
      console.error('/api/upload-document: CRITICAL - adminDb is not available. Firestore service might not be initialized on adminInstance.');
      return NextResponse.json({ error: 'Firestore Admin service not available. Check server logs.' }, { status: 500 });
    }
    if (!adminStorage || !adminStorage.app) {
      console.error('/api/upload-document: CRITICAL - adminStorage or adminStorage.app is not available. Storage service might not be initialized on adminInstance.');
      return NextResponse.json({ error: 'Storage Admin service not available. Check server logs.' }, { status: 500 });
    }
    
    const adminAppProjectId = adminInstance.app.options.projectId;
    console.log(`/api/upload-document: Firebase Admin SDK seems initialized. Operating with Project ID: ${adminAppProjectId}`);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderContext = formData.get('uploaderContext') as string || 'unknown'; 

    if (!file) {
      console.log('/api/upload-document: No file provided in formData.');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log(`/api/upload-document: File received: ${file.name}, size: ${file.size}, type: ${file.type}, context: ${uploaderContext}`);

    const envBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const fallbackBucketName = "sathi-app-3vfky.firebasestorage.app"; // Ensure this matches your target project
    const bucketName = envBucketName || fallbackBucketName;

    if (!bucketName) {
        console.error('/api/upload-document: CRITICAL - Storage bucket name is undefined or empty. Cannot proceed.');
        return NextResponse.json({ error: 'Storage bucket name is not configured on the server. Please check environment variables (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) or server configuration.' }, { status: 500 });
    }
    console.log(`/api/upload-document: Attempting to use storage bucket: ${bucketName}. (Source: ${envBucketName ? 'env variable' : 'fallback'})`);
    
    const bucket = adminStorage.bucket(bucketName);
    console.log(`/api/upload-document: Successfully got bucket object for: ${bucket.name}`);
    
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

  } catch (error: any) {
    console.error('/api/upload-document: CATASTROPHIC error in POST handler:', error);
    
    let errorMessage = 'Failed to upload file due to an unexpected internal server error.';
    let errorCode = 'UNKNOWN_ERROR';
    // Attempt to get more details if it's a FirebaseError-like object
    if (error.code && typeof error.message === 'string') { 
        errorMessage = error.message;
        errorCode = String(error.code); // Ensure code is string
        console.error(`/api/upload-document: Firebase/GCP Error Code: ${error.code}, Message: ${error.message}`);
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value , 2); 

    if (error.cause) {
      console.error('/api/upload-document: Underlying cause:', error.cause);
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      errorCode: errorCode,
      details: errorDetails 
    }, { status: 500 });
  }
}

    