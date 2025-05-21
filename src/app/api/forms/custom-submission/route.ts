
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  console.log("/api/forms/custom-submission: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/forms/custom-submission: POST - Auth Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Auth).' } }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/forms/custom-submission: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.log('/api/forms/custom-submission: POST - Unauthorized: No token provided.');
      return NextResponse.json({ error: { message: 'Unauthorized: No token provided' } }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`/api/forms/custom-submission: POST - Token verified for UID: ${decodedToken.uid}`);
    } catch (error: any) {
      console.error('Error verifying token (/api/forms/custom-submission POST):', error);
      return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
    }

    const { formId, formData } = await request.json();
    console.log("/api/forms/custom-submission: POST - Received data:", { formId, formData });
    
    if (!formId || !formData || Object.keys(formData).length === 0) {
        console.log('/api/forms/custom-submission: POST - Validation failed: Missing formId or formData.');
        return NextResponse.json({ error: {message: 'Validation Failed: Missing formId or formData.'} }, { status: 400 });
    }

    const newSubmission = {
      formId,
      formData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null, 
      submittedAt: FieldValue.serverTimestamp(),
    };
    
    console.log("/api/forms/custom-submission: POST - Attempting to add new submission to Firestore:", newSubmission);
    const docRef = await adminDb.collection('customFormSubmissions').add(newSubmission);
    console.log(`/api/forms/custom-submission: POST - Custom form submitted successfully. Firestore ID: ${docRef.id}`);
    
    return NextResponse.json({ message: 'Custom form submitted successfully', id: docRef.id }, { status: 201 });

  } catch (error: any) {
    console.error('!!! Critical Error in /api/forms/custom-submission POST !!!:', error);
    let clientErrorMessage = 'Failed to submit custom form.';
    let clientErrorCode = 'SUBMISSION_FAILED';
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
    console.error("[API Error Response Prepared] /api/forms/custom-submission POST:", JSON.stringify(errorResponsePayload));
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
