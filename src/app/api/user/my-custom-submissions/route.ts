
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-sdk';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface CustomSubmissionData {
  id: string;
  // Add other relevant fields from your custom form submission data structure
  [key: string]: any; 
  submittedAt: string | null; // Ensure this is ISO string
}

function processSubmissionData(doc: FirebaseFirestore.DocumentSnapshot): CustomSubmissionData {
  const data = doc.data();
  if (!data) {
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
  } as CustomSubmissionData;
}


export async function GET(request: NextRequest) {
  console.log("/api/user/my-custom-submissions: GET request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error('/api/user/my-custom-submissions: GET - Firebase Admin SDK not fully initialized.');
    return NextResponse.json({ error: { message: 'Server configuration error.' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    console.log('/api/user/my-custom-submissions: GET - Unauthorized: No token provided.');
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`/api/user/my-custom-submissions: GET - Token verified for UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('Error verifying token (/api/user/my-custom-submissions GET):', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  }

  try {
    const q = adminDb.collection('customFormSubmissions')
      .where('userId', '==', decodedToken.uid)
      .orderBy('submittedAt', 'desc');
    
    const snapshot = await q.get();
    const submissions = snapshot.docs.map(processSubmissionData);
    
    console.log(`/api/user/my-custom-submissions: GET - Successfully fetched ${submissions.length} custom form submissions for user ${decodedToken.uid}.`);
    return NextResponse.json(submissions);

  } catch (error: any) {
    console.error(`!!! Critical Error in /api/user/my-custom-submissions GET for user ${decodedToken.uid} !!!:`, error);
    let clientErrorMessage = 'Failed to fetch your custom form submissions.';
    let clientErrorCode = 'FETCH_FAILED';
    
    if (error.code) {
        clientErrorMessage = `Server error: ${error.message} (Code: ${error.code})`;
        clientErrorCode = String(error.code);
    } else if (error.message) {
        clientErrorMessage = error.message;
    }
    
    const errorResponsePayload = { error: { message: clientErrorMessage, code: clientErrorCode } };
    console.error("[API Error Response Prepared] /api/user/my-custom-submissions GET:", JSON.stringify(errorResponsePayload));
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
