
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, collection, query, where, getDocs, limit, addDoc } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  console.log("/api/forms/admission: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/forms/admission: POST - Auth Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Auth).' } }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/forms/admission: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.log('/api/forms/admission: POST - Unauthorized: No token provided.');
      return NextResponse.json({ error: { message: 'Unauthorized: No token provided' } }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`/api/forms/admission: POST - Token verified for UID: ${decodedToken.uid}`);
    } catch (error: any) {
      console.error('Error verifying token (/api/forms/admission POST):', error);
      return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
    }

    // Check for existing submission
    const admissionFormsRef = adminDb.collection('admissionForms');
    const q = query(admissionFormsRef, where("userId", "==", decodedToken.uid), limit(1));
    const existingSubmissionSnapshot = await getDocs(q);

    if (!existingSubmissionSnapshot.empty) {
      console.log(`/api/forms/admission: POST - User ${decodedToken.uid} has already submitted an admission form.`);
      return NextResponse.json({ error: { message: 'You have already submitted an admission form.' } }, { status: 409 }); // 409 Conflict
    }

    const formData = await request.json();
    console.log("/api/forms/admission: POST - Received form data:", formData);
    
    if (!formData.fullName || !formData.dateOfBirth || !formData.desiredProgram || !formData.statement) {
        console.log('/api/forms/admission: POST - Validation failed: Missing required fields.');
        return NextResponse.json({ error: { message: 'Validation Failed: Missing required fields.' } }, { status: 400 });
    }

    const newForm = {
      ...formData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null, 
      submittedAt: FieldValue.serverTimestamp(),
      status: "Submitted", // Initial status
    };
    
    console.log("/api/forms/admission: POST - Attempting to add new form to Firestore:", newForm);
    const docRef = await addDoc(admissionFormsRef, newForm);
    console.log(`/api/forms/admission: POST - Admission form submitted successfully. Firestore ID: ${docRef.id}`);
    
    return NextResponse.json({ message: 'Admission form submitted successfully', id: docRef.id }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting admission form (/api/forms/admission POST):', error);
    const errorDetails = error.code ? { code: error.code, message: error.message } : { message: error.message };
    return NextResponse.json({ error: { message: 'Failed to submit admission form', details: errorDetails } }, { status: 500 });
  }
}

    