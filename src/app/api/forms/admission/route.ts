
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
  // TODO: Add authentication check if needed for listing forms (e.g. only admins can list)
  try {
    const snapshot = await adminInstance.firestore.collection('admissionForms').orderBy('submittedAt', 'desc').get();
    const forms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching admission forms:', error);
    return NextResponse.json({ error: 'Failed to fetch admission forms' }, { status: 500 });
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
    const formData = await request.json();
    // TODO: Validate formData against a schema (e.g., using Zod)
    const newForm = {
      ...formData,
      userId: decodedToken.uid, // Store the UID of the authenticated user who submitted
      userEmail: decodedToken.email, // Optionally store user's email
      submittedAt: FieldValue.serverTimestamp(), // Use imported FieldValue
    };
    const docRef = await adminInstance.firestore.collection('admissionForms').add(newForm);
    return NextResponse.json({ message: 'Admission form submitted successfully', id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error submitting admission form:', error);
    return NextResponse.json({ error: 'Failed to submit admission form' }, { status: 500 });
  }
}
