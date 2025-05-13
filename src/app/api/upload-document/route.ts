import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  if (!adminInstance) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const userId = decodedToken.uid;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    });

    // Convert ArrayBuffer to Buffer
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
      userId,
      fileName: file.name,
      storagePath: fileName,
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: docRef.id,
      downloadUrl: url,
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Placeholder for adminInstance if admin.ts fails to initialize
const adminInstance = adminAuth && adminDb && adminStorage ? { auth: adminAuth, firestore: adminDb, storage: adminStorage } : null;
