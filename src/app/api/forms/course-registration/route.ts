
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'; // Use getter functions
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('/api/forms/course-registration: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection('courseRegistrations').orderBy('registeredAt', 'desc').get();
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(registrations);
  } catch (error: any) {
    console.error('Error fetching course registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch course registrations', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/forms/course-registration: POST - Auth Admin service not available.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Auth).' }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/forms/course-registration: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }
  
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token', details: error.message }, { status: 401 });
  }

  try {
    const registrationData = await request.json();
    const newRegistration = {
      ...registrationData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email,
      registeredAt: FieldValue.serverTimestamp(),
    };
    const docRef = await adminDb.collection('courseRegistrations').add(newRegistration);
    return NextResponse.json({ message: 'Course registration successful', id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing course registration:', error);
    return NextResponse.json({ error: 'Failed to process course registration', details: error.message }, { status: 500 });
  }
}
