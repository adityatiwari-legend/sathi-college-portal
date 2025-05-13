import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Ensure admin SDK is initialized
const adminInstance = adminAuth && adminDb ? { auth: adminAuth, firestore: adminDb } : null;

const SETTINGS_DOC_ID = 'appSettings'; // Single document for all app settings

export async function GET(request: NextRequest) {
  if (!adminInstance) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
  }
  // TODO: Add authentication and authorization (e.g., only admins can read settings)
  try {
    const docRef = adminInstance.firestore.collection('settings').doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ settings: {} }); // Default empty settings
    }
    return NextResponse.json({ settings: doc.data() });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
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
    // TODO: Check if user is admin (e.g., using custom claims)
    // if (!decodedToken.admin) {
    //   return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    // }
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    const settingsData = await request.json();
    // TODO: Validate settingsData
    const docRef = adminInstance.firestore.collection('settings').doc(SETTINGS_DOC_ID);
    await docRef.set(settingsData, { merge: true }); // Use merge to update existing or create new
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
