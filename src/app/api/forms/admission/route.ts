import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Ensure admin SDK is initialized
const adminInstance = adminAuth && adminDb ? { auth: adminAuth, firestore: adminDb } : null;

export async function GET(request: NextRequest) {
  if (!adminInstance) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
  }
  // TODO: Add authentication check if needed for listing forms
  try {
    const snapshot = await adminInstance.firestore.collection('admissionForms').get();
    const forms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching admission forms:', error);
    return NextResponse.json({ error: 'Failed to fetch admission forms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminInstance) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
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
    // TODO: Validate formData against a schema
    const newForm = {
      ...formData,
      userId: decodedToken.uid,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await adminInstance.firestore.collection('admissionForms').add(newForm);
    return NextResponse.json({ message: 'Admission form submitted successfully', id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error submitting admission form:', error);
    return NextResponse.json({ error: 'Failed to submit admission form' }, { status: 500 });
  }
}
