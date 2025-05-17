
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, collection, query, where, getDocs, limit, addDoc } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/forms/course-registration: POST - Auth Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Auth).' } }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/forms/course-registration: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
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
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  }

  try {
    // Check for existing submission
    const courseRegRef = adminDb.collection('courseRegistrations');
    // For simplicity, we check if ANY course registration exists for this user.
    // A more complex system might allow one registration per term.
    const q = query(courseRegRef, where("userId", "==", decodedToken.uid), limit(1));
    const existingSubmissionSnapshot = await getDocs(q);

    if (!existingSubmissionSnapshot.empty) {
      return NextResponse.json({ error: { message: 'You have already submitted a course registration form.' } }, { status: 409 });
    }

    const registrationData = await request.json();
    // Basic validation (more can be added based on schema)
    if (!registrationData.studentId || !registrationData.term || !registrationData.selectedCourses || registrationData.selectedCourses.length === 0) {
        return NextResponse.json({ error: { message: 'Validation Failed: Missing required fields for course registration.'} }, { status: 400 });
    }

    const newRegistration = {
      ...registrationData,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null, // Save user's email
      registeredAt: FieldValue.serverTimestamp(),
      status: "Submitted", // Initial status
    };
    const docRef = await addDoc(courseRegRef, newRegistration);
    return NextResponse.json({ message: 'Course registration successful', id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing course registration:', error);
    const errorDetails = error.code ? { code: error.code, message: error.message } : { message: error.message };
    return NextResponse.json({ error: { message: 'Failed to process course registration', details: errorDetails } }, { status: 500 });
  }
}

    