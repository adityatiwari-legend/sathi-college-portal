
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized correctly.' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: { message: 'Unauthorized: No token provided' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error: any) {
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  }

  try {
    const submissionData = await request.json();
    const { formId, formData } = submissionData;

    if (!formId || typeof formId !== 'string') {
      return NextResponse.json({ error: { message: 'formId is missing or invalid.' } }, { status: 400 });
    }
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: { message: 'formData is missing or invalid.' } }, { status: 400 });
    }
    
    // Optional: Fetch form definition to validate against, or to store with submission
    // const formDefDoc = await adminDb.collection('customFormSettings').doc(formId).get();
    // if (!formDefDoc.exists) {
    //   return NextResponse.json({ error: { message: `Form definition for ${formId} not found.` } }, { status: 404 });
    // }
    // const formDef = formDefDoc.data();
    // Add validation here based on formDef.fields if needed

    const newSubmission = {
      formId,
      formData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      submittedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await adminDb.collection('customFormSubmissions').add(newSubmission);
    
    return NextResponse.json({ message: 'Custom form submitted successfully', id: docRef.id }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting custom form:', error);
    return NextResponse.json({ error: { message: 'Failed to submit custom form', details: error.message } }, { status: 500 });
  }
}
