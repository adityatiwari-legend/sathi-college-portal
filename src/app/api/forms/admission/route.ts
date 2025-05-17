
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'; // Use getter functions
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  console.log("/api/forms/admission: GET request received");
  const adminDb = getAdminDb(); // Call the getter function

  if (!adminDb) {
    console.error('/api/forms/admission: GET - Firestore Admin service not available. Admin SDK might not have initialized properly.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection('admissionForms').orderBy('submittedAt', 'desc').get();
    const forms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`/api/forms/admission: GET - Successfully fetched ${forms.length} forms.`);
    return NextResponse.json(forms);
  } catch (error: any) {
    console.error('Error fetching admission forms (/api/forms/admission GET):', error);
    return NextResponse.json({ error: 'Failed to fetch admission forms', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("/api/forms/admission: POST request received");
  const adminAuth = getAdminAuth(); // Call the getter function
  const adminDb = getAdminDb();     // Call the getter function

  if (!adminAuth) {
    console.error('/api/forms/admission: POST - Auth Admin service not available. Admin SDK might not have initialized properly.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Auth).' }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/forms/admission: POST - Firestore Admin service not available. Admin SDK might not have initialized properly.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.log('/api/forms/admission: POST - Unauthorized: No token provided.');
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`/api/forms/admission: POST - Token verified for UID: ${decodedToken.uid}`);
    } catch (error: any) {
      console.error('Error verifying token (/api/forms/admission POST):', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token', details: error.message }, { status: 401 });
    }

    const formData = await request.json();
    console.log("/api/forms/admission: POST - Received form data:", formData);
    
    if (!formData.fullName || !formData.dateOfBirth || !formData.desiredProgram || !formData.statement) {
        console.log('/api/forms/admission: POST - Validation failed: Missing required fields.');
        return NextResponse.json({ error: 'Validation Failed: Missing required fields.' }, { status: 400 });
    }

    const newForm = {
      ...formData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null, 
      submittedAt: FieldValue.serverTimestamp(),
    };
    
    console.log("/api/forms/admission: POST - Attempting to add new form to Firestore:", newForm);
    const docRef = await adminDb.collection('admissionForms').add(newForm);
    console.log(`/api/forms/admission: POST - Admission form submitted successfully. Firestore ID: ${docRef.id}`);
    
    return NextResponse.json({ message: 'Admission form submitted successfully', id: docRef.id }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting admission form (/api/forms/admission POST):', error);
    const errorDetails = error.code ? { code: error.code, message: error.message, stack: error.stack } : { message: error.message, stack: error.stack };
    return NextResponse.json({ error: 'Failed to submit admission form', details: errorDetails }, { status: 500 });
  }
}
