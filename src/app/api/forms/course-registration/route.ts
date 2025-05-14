
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore'; // Correct import for FieldValue

// Ensure admin SDK is initialized
const adminInstance = adminAuth && adminDb ? { auth: adminAuth, firestore: adminDb } : null;


export async function GET(request: NextRequest) {
  if (!adminInstance || !adminInstance.firestore) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }
  // TODO: Add authentication check if needed (e.g., only admins can list)
  try {
    const snapshot = await adminInstance.firestore.collection('courseRegistrations').orderBy('registeredAt', 'desc').get();
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching course registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch course registrations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminInstance || !adminInstance.auth || !adminInstance.firestore) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Auth or Firestore).' }, { status: 500 });
  }
  
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminInstance.auth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    const registrationData = await request.json();
    // TODO: Validate registrationData against a schema
    const newRegistration = {
      ...registrationData,
      userId: decodedToken.uid, // Store the UID of the authenticated user
      userEmail: decodedToken.email, // Optionally store user's email
      registeredAt: FieldValue.serverTimestamp(), // Use imported FieldValue
    };
    const docRef = await adminInstance.firestore.collection('courseRegistrations').add(newRegistration);
    return NextResponse.json({ message: 'Course registration successful', id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error processing course registration:', error);
    return NextResponse.json({ error: 'Failed to process course registration' }, { status: 500 });
  }
}
