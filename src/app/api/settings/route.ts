
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue

// Ensure admin SDK is initialized
const adminInstance = adminAuth && adminDb ? { auth: adminAuth, firestore: adminDb } : null;

const SETTINGS_COLLECTION = 'settings';
const APP_SETTINGS_DOC_ID = 'appGlobalSettings'; // Single document for all app settings

export async function GET(request: NextRequest) {
  if (!adminInstance || !adminInstance.firestore) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }

  // TODO: Secure this endpoint. Only authenticated admins should access settings.
  // For now, allowing GET for simplicity, but this should be locked down.
  // Example: Check for admin role after verifying token if this needs auth.

  try {
    const docRef = adminInstance.firestore.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
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
    // TODO: Implement role-based access control.
    // E.g., check for a custom claim like `decodedToken.admin === true`
    // if (!decodedToken.adminRole) { // Assuming 'adminRole' is a custom claim
    //   return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update settings' }, { status: 403 });
    // }
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    const settingsData = await request.json();
    // TODO: Validate settingsData against a schema
    const docRef = adminInstance.firestore.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
    
    const dataToUpdate = {
        ...settingsData,
        lastUpdatedBy: decodedToken.uid,
        lastUpdatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(dataToUpdate, { merge: true }); // Use merge to update existing or create new
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
