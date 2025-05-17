
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminStorage } from '@/lib/firebase/admin'; // Use getter functions
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try { 
    console.log('/api/upload-document: POST request received.');

    const adminApp = getAdminApp();
    const adminDbInstance = getAdminDb();
    const adminStorageInstance = getAdminStorage();

    // --- Critical Initialization Checks ---
    if (!adminApp) {
      console.error('/api/upload-document: CRITICAL - Firebase Admin App instance is NOT available (getAdminApp() returned null/undefined). Check admin.ts initialization logs.');
      return NextResponse.json({ 
        error: { 
          message: 'Internal Server Error: Firebase Admin App failed to initialize. Please check server logs.', 
          code: 'ADMIN_APP_UNAVAILABLE' 
        } 
      }, { status: 500 });
    }
    console.log('/api/upload-document: Firebase Admin App instance obtained.');

    if (!adminApp.options) {
      console.error('/api/upload-document: CRITICAL - Firebase Admin App instance is available, but its options are missing. This is unexpected.');
      return NextResponse.json({ 
        error: { 
          message: 'Internal Server Error: Firebase Admin App options are missing. Check server logs for admin.ts issues.', 
          code: 'ADMIN_APP_OPTIONS_MISSING' 
        } 
      }, { status: 500 });
    }
    const adminAppProjectId = adminApp.options.projectId;
    if (!adminAppProjectId) {
      console.error('/api/upload-document: CRITICAL - Firebase Admin App Project ID is missing from options.');
       return NextResponse.json({ 
        error: { 
          message: 'Internal Server Error: Firebase Admin App Project ID is missing. Check server logs for admin.ts issues.', 
          code: 'ADMIN_APP_PROJECT_ID_MISSING' 
        } 
      }, { status: 500 });
    }
    console.log(`/api/upload-document: Firebase Admin App Project ID: ${adminAppProjectId}`);

    if (!adminDbInstance) {
      console.error('/api/upload-document: CRITICAL - adminDbInstance is not available from getAdminDb(). Firestore service might not be initialized.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available. Check server logs.', code: 'FIRESTORE_INIT_FAILURE'} }, { status: 500 });
    }
    console.log('/api/upload-document: Firestore Admin service instance obtained.');

    if (!adminStorageInstance || !adminStorageInstance.app) {
      console.error('/api/upload-document: CRITICAL - adminStorageInstance or adminStorageInstance.app is not available. Storage service might not be initialized.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Storage Admin service not available. Check server logs.', code: 'STORAGE_INIT_FAILURE'} }, { status: 500 });
    }
    console.log('/api/upload-document: Storage Admin service instance obtained.');
    // --- End Critical Initialization Checks ---
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderContext = formData.get('uploaderContext') as string || 'unknown'; 

    if (!file) {
      console.log('/api/upload-document: No file provided in formData.');
      return NextResponse.json({ error: { message: 'No file provided', code: 'NO_FILE_PROVIDED' } }, { status: 400 });
    }
    console.log(`/api/upload-document: File received: ${file.name}, size: ${file.size}, type: ${file.type}, context: ${uploaderContext}`);

    const envBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const fallbackBucketName = "sathi-app-3vfky.firebasestorage.app"; 
    const bucketName = envBucketName || fallbackBucketName;

    if (!bucketName) {
        console.error('/api/upload-document: CRITICAL - Storage bucket name is undefined or empty. Cannot proceed.');
        return NextResponse.json({ error: { message: 'Storage bucket name is not configured on the server. Please check environment variables (e.g., NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) or server configuration.', code: 'BUCKET_NAME_MISSING' } }, { status: 500 });
    }
    console.log(`/api/upload-document: Attempting to use storage bucket: ${bucketName}. (Source: ${envBucketName ? 'env variable' : 'fallback'})`);
    
    const bucket = adminStorageInstance.bucket(bucketName);
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
    const docRef = await adminDbInstance.collection('uploadedDocuments').add({
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
    
    if (error.code && typeof error.message === 'string') { 
        errorMessage = error.message;
        errorCode = String(error.code);
        console.error(`/api/upload-document: Firebase/GCP Error Code: ${errorCode}, Message: ${errorMessage}`);
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
      error: { // Ensure error is an object
        message: errorMessage, 
        code: errorCode,
      },
      details: errorDetails // Keep details for server-side logging clarity
    }, { status: 500 });
  }
}
