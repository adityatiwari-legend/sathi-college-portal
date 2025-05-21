
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-sdk';
import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface CourseRegistrationData {
  id: string;
  // Add other relevant fields from your course registration data structure
  [key: string]: any; 
  registeredAt: string | null; // Ensure this is ISO string
}

function processRegistrationData(doc: FirebaseFirestore.DocumentSnapshot): CourseRegistrationData {
  const data = doc.data();
  if (!data) {
    return { id: doc.id, registeredAt: null };
  }
  let registeredAtISO: string | null = null;
  const regTimestamp = data.registeredAt || data.submittedAt; // Prefer registeredAt, fallback to submittedAt

  if (regTimestamp && regTimestamp instanceof Timestamp) {
    registeredAtISO = regTimestamp.toDate().toISOString();
  } else if (regTimestamp && typeof regTimestamp === 'string') {
     try {
      registeredAtISO = new Date(regTimestamp).toISOString();
    } catch (e) {
      console.warn(`Could not parse date string for registeredAt/submittedAt in doc ${doc.id}: ${regTimestamp}`);
    }
  }
  return {
    id: doc.id,
    ...data,
    registeredAt: registeredAtISO,
  } as CourseRegistrationData;
}

export async function GET(request: NextRequest) {
  console.log("/api/user/my-course-registrations: GET request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth || !adminDb) {
    console.error('/api/user/my-course-registrations: GET - Firebase Admin SDK not fully initialized.');
    return NextResponse.json({ error: { message: 'Server configuration error.' } }, { status: 500 });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    console.log('/api/user/my-course-registrations: GET - Unauthorized: No token provided.');
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`/api/user/my-course-registrations: GET - Token verified for UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('Error verifying token (/api/user/my-course-registrations GET):', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  }

  try {
    const q = adminDb.collection('courseRegistrations')
      .where('userId', '==', decodedToken.uid)
      .orderBy('registeredAt', 'desc'); // Assuming 'registeredAt' is the submission timestamp
    
    const snapshot = await q.get();
    const registrations = snapshot.docs.map(processRegistrationData);
    
    console.log(`/api/user/my-course-registrations: GET - Successfully fetched ${registrations.length} course registrations for user ${decodedToken.uid}.`);
    return NextResponse.json(registrations);

  } catch (error: any) {
    console.error(`!!! Critical Error in /api/user/my-course-registrations GET for user ${decodedToken.uid} !!!:`, error);
    let clientErrorMessage = 'Failed to fetch your course registrations.';
    let clientErrorCode = 'FETCH_FAILED';
    
    if (error.code) {
        clientErrorMessage = `Server error: ${error.message} (Code: ${error.code})`;
        clientErrorCode = String(error.code);
    } else if (error.message) {
        clientErrorMessage = error.message;
    }
    
    const errorResponsePayload = { error: { message: clientErrorMessage, code: clientErrorCode } };
    console.error("[API Error Response Prepared] /api/user/my-course-registrations GET:", JSON.stringify(errorResponsePayload));
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
