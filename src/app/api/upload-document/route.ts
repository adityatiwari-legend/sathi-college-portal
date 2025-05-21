
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminStorage } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  console.log('/api/upload-document: POST request received.');
  let adminApp;
  let adminDbInstance;
  let adminStorageInstance;

  try {
    adminApp = getAdminApp();
    adminDbInstance = getAdminDb();
    adminStorageInstance = getAdminStorage();

    if (!adminApp) {
      console.error('/api/upload-document: CRITICAL - Firebase Admin App instance is NOT available.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Firebase Admin App failed to initialize.', code: 'ADMIN_APP_UNAVAILABLE' }}, { status: 500 });
    }
    console.log(`/api/upload-document: Firebase Admin App obtained. Project ID from app options: ${adminApp.options?.projectId || 'N/A (options missing!)'}`);
     if (!adminApp.options?.projectId) {
       console.error('/api/upload-document: CRITICAL - Admin App options or projectId is missing!');
       return NextResponse.json({ error: { message: 'Internal Server Error: Firebase Admin App options or projectId missing.', code: 'ADMIN_APP_OPTIONS_MISSING' }}, { status: 500 });
     }


    if (!adminDbInstance) {
      console.error('/api/upload-document: CRITICAL - Firestore Admin service (adminDbInstance) not available.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available.', code: 'FIRESTORE_UNAVAILABLE' }}, { status: 500 });
    }
    if (!adminStorageInstance) {
      console.error('/api/upload-document: CRITICAL - Storage Admin service (adminStorageInstance) not available.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Storage Admin service not available.', code: 'STORAGE_UNAVAILABLE' }}, { status: 500 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderContext = formData.get('uploaderContext') as string || 'unknown'; 

    if (!file) {
      console.log('/api/upload-document: No file provided.');
      return NextResponse.json({ error: { message: 'No file provided', code: 'NO_FILE_PROVIDED' } }, { status: 400 });
    }
    console.log(`/api/upload-document: File: ${file.name}, Size: ${file.size}, Type: ${file.type}, Context: ${uploaderContext}`);

    // Determine bucket name
    const envBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const fallbackBucketName = "sathi-app-3vfky.firebasestorage.app"; // Ensure this is your correct fallback for sathi-app-3vfky
    const bucketName = envBucketName || fallbackBucketName;

    if (!bucketName) {
        console.error('/api/upload-document: CRITICAL - Storage bucket name is undefined. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or hardcoded fallback.');
        return NextResponse.json({ error: { message: 'Storage bucket name not configured on server.', code: 'BUCKET_NAME_MISSING' } }, { status: 500 });
    }
    console.log(`/api/upload-document: Using storage bucket: ${bucketName}. (Source: ${envBucketName ? 'env variable' : 'fallback'})`);
    
    const bucket = adminStorageInstance.bucket(bucketName);
    console.log(`/api/upload-document: Bucket object obtained for: ${bucket.name}`);
    
    const basePath = uploaderContext === 'admin' ? 'admin_uploads' : (uploaderContext === 'timetable' ? 'timetables' : 'user_uploads');
    const fileNameInStorage = `${basePath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    console.log(`/api/upload-document: Target storage path: ${fileNameInStorage}`);
    
    const fileUpload = bucket.file(fileNameInStorage);
    const stream = fileUpload.createWriteStream({ metadata: { contentType: file.type } });
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`/api/upload-document: File buffer length: ${fileBuffer.length}`);

    await new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        console.error('/api/upload-document: Firebase Storage stream upload error:', err);
        reject(err);
      });
      stream.on('finish', () => {
        console.log('/api/upload-document: Firebase Storage stream finished.');
        resolve(true);
      });
      stream.end(fileBuffer);
    });

    console.log('/api/upload-document: File uploaded. Getting signed URL...');
    const [url] = await fileUpload.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    console.log(`/api/upload-document: Signed URL generated: ${url.substring(0, 100)}...`);

    console.log('/api/upload-document: Adding document metadata to Firestore "uploadedDocuments"...');
    const docData = {
      uploaderContext: uploaderContext,
      originalFileName: file.name,
      storagePath: fileNameInStorage, // Essential for deletion
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
    };
    console.log('/api/upload-document: Firestore document data:', docData);
    const docRef = await adminDbInstance.collection('uploadedDocuments').add(docData);
    console.log(`/api/upload-document: Firestore document created: ${docRef.id}`);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: docRef.id,
      downloadUrl: url,
    });

  } catch (error: any) {
    console.error('!!! Critical Error in /api/upload-document POST !!!:', error);
    let clientErrorMessage = 'Failed to upload file due to an unexpected internal server error.';
    let clientErrorCode = 'UPLOAD_FAILED_UNKNOWN';
    let serverDetails = {};

    if (error.code) { 
        clientErrorMessage = `Server error: ${error.message} (Code: ${error.code})`;
        clientErrorCode = String(error.code);
    } else if (error.message) {
        clientErrorMessage = error.message;
    }
    
    if (process.env.NODE_ENV === 'development') {
        serverDetails = { name: error.name, message: error.message, code: error.code, stack: error.stack };
    }
    
    const errorResponsePayload = { error: { message: clientErrorMessage, code: clientErrorCode, ...(process.env.NODE_ENV === 'development' && { serverDetails }) } };
    console.error("[API Error Response Prepared] /api/upload-document POST:", JSON.stringify(errorResponsePayload));
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
