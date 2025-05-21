
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-sdk';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface AdmissionFormData {
  id: string;
  // Add other relevant fields from your admission form data structure
  [key: string]: any; 
  submittedAt: string | null; // Ensure this is ISO string
}

function processFormData(doc: FirebaseFirestore.DocumentSnapshot): AdmissionFormData {
  const data = doc.data();
  if (!data) {
    // This case should ideally not happen if doc.exists is true
    // but as a fallback:
    return { id: doc.id, submittedAt: null }; 
  }
  let submittedAtISO: string | null = null;
  if (data.submittedAt && data.submittedAt instanceof Timestamp) {
    submittedAtISO = data.submittedAt.toDate().toISOString();
  } else if (data.submittedAt && typeof data.submittedAt === 'string') {
    try {
      submittedAtISO = new Date(data.submittedAt).toISOString();
    } catch (e) {
      console.warn(`Could not parse date string for submittedAt in doc ${doc.id}: ${data.submittedAt}`);
    }
  }
  return {
    id: doc.id,
    ...data,
    submittedAt: submittedAtISO,
  } as AdmissionFormData;
}


export async function GET(request: NextRequest) {
  console.log("/api/user/my-admission-forms: GET request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error('/api/user/my-admission-forms: GET - Firebase Admin SDK not fully initialized.');
    return NextResponse.json({ error: { message: 'Server configuration error.' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    console.log('/api/user/my-admission-forms: GET - Unauthorized: No token provided.');
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`/api/user/my-admission-forms: GET - Token verified for UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('Error verifying token (/api/user/my-admission-forms GET):', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  }

  try {
    const q = adminDb.collection('admissionForms')
      .where('userId', '==', decodedToken.uid)
      .orderBy('submittedAt', 'desc');
    
    const snapshot = await q.get();
    const forms = snapshot.docs.map(processFormData);
    
    console.log(`/api/user/my-admission-forms: GET - Successfully fetched ${forms.length} admission forms for user ${decodedToken.uid}.`);
    return NextResponse.json(forms);

  } catch (error: any) {
    console.error(`!!! Critical Error in /api/user/my-admission-forms GET for user ${decodedToken.uid} !!!:`, error);
    let clientErrorMessage = 'Failed to fetch your admission forms.';
    let clientErrorCode = 'FETCH_FAILED';
    
    if (error.code) {
        clientErrorMessage = `Server error: ${error.message} (Code: ${error.code})`;
        clientErrorCode = String(error.code);
    } else if (error.message) {
        clientErrorMessage = error.message;
    }
    
    const errorResponsePayload = { error: { message: clientErrorMessage, code: clientErrorCode } };
    console.error("[API Error Response Prepared] /api/user/my-admission-forms GET:", JSON.stringify(errorResponsePayload));
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
