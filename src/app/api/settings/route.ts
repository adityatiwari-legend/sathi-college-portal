
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'; // Use getter functions
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

const SETTINGS_COLLECTION = 'settings';
const APP_SETTINGS_DOC_ID = 'appGlobalSettings';

export async function GET(request: NextRequest) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('/api/settings: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Firestore).' }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ settings: {} });
    }
    return NextResponse.json({ settings: doc.data() });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/settings: POST - Auth Admin service not available.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized (Auth).' }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/settings: POST - Firestore Admin service not available.');
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
    const settingsData = await request.json();
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
    
    const dataToUpdate = {
        ...settingsData,
        lastUpdatedBy: decodedToken.uid,
        lastUpdatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(dataToUpdate, { merge: true });
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 });
  }
}
