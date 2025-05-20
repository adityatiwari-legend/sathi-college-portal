
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

const SETTINGS_COLLECTION = 'settings';
const APP_SETTINGS_DOC_ID = 'appGlobalSettings';

export async function GET(request: NextRequest) {
  console.log("/api/settings: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/settings: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available.', code: 'FIRESTORE_UNAVAILABLE' } }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log("/api/settings: GET - No appGlobalSettings document found. Returning empty settings.");
      return NextResponse.json({ settings: {} });
    }
    
    const settings = docSnap.data();
    console.log("/api/settings: GET - Successfully fetched appGlobalSettings:", settings);
    return NextResponse.json({ settings });

  } catch (error: any) {
    console.error('Error fetching appGlobalSettings (/api/settings GET):', error);
    return NextResponse.json({ error: { message: 'Failed to fetch application settings', details: error.message, code: error.code || 'FETCH_SETTINGS_ERROR' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("/api/settings: POST request received");
  const adminDb = getAdminDb();
  // const adminAuth = getAdminAuth(); // Keep for future admin verification

  // if (!adminAuth) {
  //   console.error('/api/settings: POST - Auth Admin service not available.');
  //   return NextResponse.json({ error: { message: 'Internal Server Error: Auth Admin service not available.', code: 'AUTH_UNAVAILABLE' } }, { status: 500 });
  // }
  if (!adminDb) {
    console.error('/api/settings: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available.', code: 'FIRESTORE_UNAVAILABLE' } }, { status: 500 });
  }
  
  // Placeholder for admin authentication - in a real app, verify an admin token.
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ')) {
  //   return NextResponse.json({ error: { message: 'Unauthorized: No token provided' } }, { status: 401 });
  // }
  // const idToken = authorization.split('Bearer ')[1];
  // let decodedToken: DecodedIdToken;
  // try {
  //   decodedToken = await adminAuth.verifyIdToken(idToken);
  //   // Add check for admin custom claim if implemented:
  //   // if (!decodedToken.admin) { // Assuming 'admin' is your custom claim
  //   //   return NextResponse.json({ error: { message: 'Forbidden: User is not an administrator.' } }, { status: 403 });
  //   // }
  // } catch (error: any) {
  //   console.error('Error verifying admin token (/api/settings POST):', error);
  //   return NextResponse.json({ error: { message: 'Unauthorized: Invalid token', details: error.message } }, { status: 401 });
  // }

  try {
    const settingsData = await request.json();
    console.log("/api/settings: POST - Received settings data for update:", settingsData);

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(APP_SETTINGS_DOC_ID);
    
    const dataToUpdate = {
      ...settingsData,
      // lastUpdatedBy: decodedToken.uid, // Uncomment when admin auth is implemented
      lastUpdatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(dataToUpdate, { merge: true }); // Use set with merge:true to create or update
    console.log("/api/settings: POST - Application settings updated successfully.");
    return NextResponse.json({ message: 'Application settings updated successfully' });

  } catch (error: any) {
    console.error('Error updating application settings (/api/settings POST):', error);
    const errorDetails = error.code ? { code: error.code, message: error.message } : { message: error.message };
    return NextResponse.json({ error: { message: 'Failed to update application settings', details: errorDetails } }, { status: 500 });
  }
}
