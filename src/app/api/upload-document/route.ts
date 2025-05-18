import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try { 
    console.log('/api/upload-document: POST request received.');

    const adminApp = getAdminApp();
    const adminDbInstance = getAdminDb();
    const adminStorageInstance = getAdminStorage();

    if (!adminApp) {
      console.error('/api/upload-document: CRITICAL - Firebase Admin App instance is NOT available.');
      return NextResponse.json({ error: { message: 'Internal Server Error: Firebase Admin App failed to initialize.', code: 'ADMIN_APP_UNAVAILABLE' }}, { status: 500 });
    }
    
    const adminAppProjectId = adminApp.options.projectId;
    if (!adminAppProjectId) {
        console.error('/api/upload-document: CRITICAL - Firebase Admin App projectId is undefined.');
        return NextResponse.json({ error: { message: 'Internal Server Error: Firebase Admin App projectId is undefined.', code: 'ADMIN_PROJECT_ID_UNAVAILABLE' }}, { status: 500 });
    }
    console.log(`/api/upload-document: Firebase Admin App obtained. Project ID: ${adminAppProjectId}`);


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

    const envBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    // Fallback derived from admin app's project ID if env var is not set
    const derivedDefaultBucketName = `${adminAppProjectId}.appspot.com`;
    const fallbackBucketName = "sathi-app-3vfky.firebasestorage.app"; // Previous hardcoded
    
    let bucketName = envBucketName;
    let bucketSource = "environment variable (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)";

    if (!bucketName) {
        bucketName = derivedDefaultBucketName;
        bucketSource = "derived from Admin SDK projectId";
    }
    // If derived also seems problematic, use the ultimate fallback
    if (!bucketName || bucketName.includes("YOUR_PROJECT_ID")) { // Check against placeholder
        bucketName = fallbackBucketName;
        bucketSource = "hardcoded fallback (sathi-app-3vfky.firebasestorage.app)";
    }


    if (!bucketName) {
        console.error('/api/upload-document: CRITICAL - Storage bucket name is undefined and could not be derived. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or Admin SDK projectId.');
        return NextResponse.json({ error: { message: 'Storage bucket name not configured on server.', code: 'BUCKET_NAME_MISSING' } }, { status: 500 });
    }
    console.log(`/api/upload-document: Using storage bucket: ${bucketName}. (Source: ${bucketSource})`);
    
    const bucket = adminStorageInstance.bucket(bucketName);
    console.log(`/api/upload-document: Bucket object obtained for: ${bucket.name}`);
    
    let basePath = 'general_uploads'; // Default path
    if (uploaderContext === 'admin') {
      basePath = 'admin_uploads';
    } else if (uploaderContext === 'timetable') {
      basePath = 'timetables';
    } else if (uploaderContext === 'user_document') { // Example for potential future user-specific uploads
      // For user uploads, you'd typically include userId in the path
      // const userId = formData.get('userId'); // Assuming userId is passed for user uploads
      // basePath = `user_uploads/${userId || 'unknown_user'}`;
      basePath = 'user_uploads'; // For now, keep it simple
    }

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
    const [url] = await fileUpload.getSignedUrl({ action: 'read', expires: '03-09-2491' }); // Long expiry
    console.log(`/api/upload-document: Signed URL: ${url}`);

    console.log('/api/upload-document: Adding document metadata to Firestore "uploadedDocuments"...');
    const docRef = await adminDbInstance.collection('uploadedDocuments').add({
      uploaderContext: uploaderContext, // Save the context
      originalFileName: file.name,
      storagePath: fileNameInStorage,
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
    });
    console.log(`/api/upload-document: Firestore document created: ${docRef.id} with context: ${uploaderContext}`);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: docRef.id,
      downloadUrl: url,
    });

  } catch (error: any) {
    console.error('/api/upload-document: CATASTROPHIC error in POST handler:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    const errorMessage = error.message || 'Failed to upload file due to an unexpected internal server error.';
    const errorCode = String(error.code || error.name || 'UNKNOWN_API_ERROR');
    
    return NextResponse.json({ 
      error: { 
        message: errorMessage, 
        code: errorCode,
        details: error.stack // Include stack for more debug info
      } 
    }, { status: 500 });
  }
}
