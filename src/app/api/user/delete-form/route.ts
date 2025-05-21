
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, getAdminStorage, getAdminApp } from '@/lib/firebase/admin-sdk';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  console.log("/api/user/delete-form: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage(); // For potential file deletions if forms had uploads
  const adminApp = getAdminApp();


  if (!adminAuth || !adminDb || !adminStorage || !adminApp) {
    console.error('/api/user/delete-form: POST - Firebase Admin SDK not fully initialized.');
    return NextResponse.json({ error: { message: 'Server configuration error.', code: 'ADMIN_SDK_INIT_FAILURE' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    console.log('/api/user/delete-form: POST - Unauthorized: No token provided.');
    return NextResponse.json({ error: { message: 'Unauthorized: No token provided', code: 'NO_TOKEN' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`/api/user/delete-form: POST - Token verified for UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('Error verifying token (/api/user/delete-form POST):', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', code: 'INVALID_TOKEN', details: error.message } }, { status: 401 });
  }

  try {
    const { formId, formType, storagePath } = await request.json(); // storagePath might be undefined for forms without uploads
    console.log(`/api/user/delete-form: POST - Request to delete formId: ${formId}, formType: ${formType}, storagePath: ${storagePath}`);

    if (!formId || !formType) {
      console.log('/api/user/delete-form: POST - Bad Request: Missing formId or formType.');
      return NextResponse.json({ error: { message: 'Missing formId or formType in request body', code: 'MISSING_PARAMS' } }, { status: 400 });
    }

    let collectionName = '';
    switch (formType) {
      case 'Admission':
        collectionName = 'admissionForms';
        break;
      case 'Course Registration':
        collectionName = 'courseRegistrations';
        break;
      case 'Custom Form':
        collectionName = 'customFormSubmissions';
        break;
      default:
        console.log(`/api/user/delete-form: POST - Bad Request: Invalid formType: ${formType}`);
        return NextResponse.json({ error: { message: 'Invalid form type provided', code: 'INVALID_FORM_TYPE' } }, { status: 400 });
    }

    const docRef = adminDb.collection(collectionName).doc(formId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`/api/user/delete-form: POST - Not Found: Form ${formId} in ${collectionName} not found.`);
      return NextResponse.json({ error: { message: 'Form submission not found.', code: 'FORM_NOT_FOUND' } }, { status: 404 });
    }

    const formData = docSnap.data();
    if (formData?.userId !== decodedToken.uid) {
      console.warn(`/api/user/delete-form: POST - Forbidden: User ${decodedToken.uid} attempted to delete form ${formId} belonging to user ${formData?.userId}.`);
      return NextResponse.json({ error: { message: 'Forbidden: You do not have permission to delete this form.', code: 'FORBIDDEN_DELETION' } }, { status: 403 });
    }

    // Placeholder: If forms could have associated file uploads, delete them from Storage here.
    // For example, if formData contained a storagePath for an uploaded file.
    // if (formData.associatedFilePath && adminStorage) {
    //   try {
    //     const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${adminApp.options.projectId}.appspot.com`;
    //     const bucket = adminStorage.bucket(bucketName);
    //     const file = bucket.file(formData.associatedFilePath);
    //     await file.delete();
    //     console.log(`/api/user/delete-form: POST - Successfully deleted associated file from Storage: ${formData.associatedFilePath}`);
    //   } catch (storageError: any) {
    //     console.warn(`/api/user/delete-form: POST - Failed to delete associated file from Storage (path: ${formData.associatedFilePath}), but proceeding with Firestore deletion:`, storageError.message);
    //   }
    // }

    await docRef.delete();
    console.log(`ADMIN NOTIFICATION (SERVER LOG): User ${decodedToken.uid} (Email: ${decodedToken.email || 'N/A'}) deleted ${formType} form with ID: ${formId}.`);
    console.log(`/api/user/delete-form: POST - Successfully deleted form ${formId} from ${collectionName}.`);
    
    return NextResponse.json({ message: `${formType} form deleted successfully.` });

  } catch (error: any) {
    console.error('Error deleting form submission (/api/user/delete-form POST):', error);
    return NextResponse.json({ error: { message: 'Failed to delete form submission.', code: 'DELETE_FAILED', details: error.message } }, { status: 500 });
  }
}
