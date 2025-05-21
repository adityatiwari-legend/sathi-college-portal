
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-sdk';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to convert Firestore Timestamps to ISO strings
function convertTimestamps(data: any): any {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  if (typeof data === 'object' && data !== null) {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertTimestamps(data[key]);
    }
    return newData;
  }
  return data;
}

export async function GET(request: NextRequest) {
  console.log("/api/user/form-detail: GET request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error('/api/user/form-detail: GET - Firebase Admin SDK not fully initialized.');
    return NextResponse.json({ error: { message: 'Server configuration error.', code: 'ADMIN_SDK_INIT_FAILURE' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    console.log('/api/user/form-detail: GET - Unauthorized: No token provided.');
    return NextResponse.json({ error: { message: 'Unauthorized: No token provided', code: 'NO_TOKEN' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`/api/user/form-detail: GET - Token verified for UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('Error verifying token (/api/user/form-detail GET):', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', code: 'INVALID_TOKEN', details: error.message } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('id');
  const formType = searchParams.get('type');

  if (!formId || !formType) {
    console.log('/api/user/form-detail: GET - Bad Request: Missing formId or formType parameter.');
    return NextResponse.json({ error: { message: 'Missing formId or formType parameter', code: 'MISSING_PARAMS' } }, { status: 400 });
  }
  console.log(`/api/user/form-detail: GET - Fetching details for formId: ${formId}, formType: ${formType}, userId: ${decodedToken.uid}`);

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
      console.log(`/api/user/form-detail: GET - Bad Request: Invalid formType: ${formType}`);
      return NextResponse.json({ error: { message: 'Invalid form type', code: 'INVALID_FORM_TYPE' } }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection(collectionName).doc(formId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`/api/user/form-detail: GET - Not Found: No form found for formId: ${formId} in collection: ${collectionName}`);
      return NextResponse.json({ error: { message: 'Form not found', code: 'FORM_NOT_FOUND' } }, { status: 404 });
    }
    
    const formData = docSnap.data();
    if (!formData) { // Should not happen if docSnap.exists is true
        console.error(`/api/user/form-detail: GET - Internal Server Error: Document exists but data is undefined for formId: ${formId}`);
        return NextResponse.json({ error: { message: 'Error retrieving form data.', code: 'DATA_UNDEFINED' } }, { status: 500 });
    }

    // Security Check: Ensure the fetched document belongs to the authenticated user
    if (formData.userId !== decodedToken.uid) {
      console.warn(`/api/user/form-detail: GET - Forbidden: User ${decodedToken.uid} attempted to access form ${formId} belonging to user ${formData.userId}.`);
      return NextResponse.json({ error: { message: 'Forbidden: You do not have permission to view this form.', code: 'FORBIDDEN_ACCESS' } }, { status: 403 });
    }
    
    const processedData = convertTimestamps(formData);

    console.log(`/api/user/form-detail: GET - Successfully fetched form details for formId: ${formId}`);
    return NextResponse.json({ form: processedData });

  } catch (error: any) {
    console.error(`Error fetching form details for formId ${formId} (${formType}) (/api/user/form-detail GET):`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch form details.', code: 'FETCH_FAILED', details: error.message } }, { status: 500 });
  }
}
