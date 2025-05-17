
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SETTINGS_COLLECTION = 'formSettings'; // Changed from 'settings' to be more specific

export async function GET(request: NextRequest) {
  console.log("/api/admin/form-settings: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/form-settings: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available.', code: 'FIRESTORE_UNAVAILABLE' } }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const formType = searchParams.get('formType');

  if (!formType) {
    console.log('/api/admin/form-settings: GET - Bad Request: formType is required.');
    return NextResponse.json({ error: { message: 'formType query parameter is required.', code: 'MISSING_FORM_TYPE' } }, { status: 400 });
  }
  console.log(`/api/admin/form-settings: GET - Fetching settings for formType: ${formType}`);

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formType);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`/api/admin/form-settings: GET - No settings found for formType: ${formType}. Returning empty object.`);
      return NextResponse.json({ settings: {} });
    }
    
    const settingsData = doc.data();
    console.log(`/api/admin/form-settings: GET - Successfully fetched settings for formType: ${formType}`, settingsData);
    return NextResponse.json({ settings: settingsData });

  } catch (error: any) {
    console.error(`Error fetching settings for formType ${formType} (/api/admin/form-settings GET):`, error);
    return NextResponse.json({ error: { message: `Failed to fetch settings for ${formType}`, details: error.message, code: error.code || 'FETCH_SETTINGS_ERROR' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("/api/admin/form-settings: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/admin/form-settings: POST - Auth Admin service not available.');
    return NextResponse.json({ error: { message: 'Internal Server Error: Auth Admin service not available.', code: 'AUTH_UNAVAILABLE' } }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/admin/form-settings: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Internal Server Error: Firestore Admin service not available.', code: 'FIRESTORE_UNAVAILABLE' } }, { status: 500 });
  }
  
  // TODO: Implement proper admin authentication/authorization.
  // For now, we assume any request to this endpoint might be from an admin context if it contains a token,
  // but we are not strictly enforcing admin role here. This is a placeholder for future security enhancement.
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ')) {
  //   return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  // }
  // const idToken = authorization.split('Bearer ')[1];
  // let decodedToken: DecodedIdToken;
  // try {
  //   decodedToken = await adminAuth.verifyIdToken(idToken);
  // // Check for admin custom claim here if implementing role-based access
  // } catch (error: any) {
  //   console.error('Error verifying token:', error);
  //   return NextResponse.json({ error: 'Unauthorized: Invalid token', details: error.message }, { status: 401 });
  // }

  try {
    const settingsData = await request.json();
    console.log("/api/admin/form-settings: POST - Received settings data:", settingsData);

    const { formType, ...dataToSave } = settingsData;

    if (!formType || typeof formType !== 'string') {
      console.log('/api/admin/form-settings: POST - Bad Request: formType is missing or invalid.');
      return NextResponse.json({ error: { message: 'formType is missing or invalid in the request body.', code: 'INVALID_FORM_TYPE' } }, { status: 400 });
    }

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formType);
    
    const updatePayload = {
        ...dataToSave,
        // lastUpdatedBy: decodedToken.uid, // Uncomment if using token verification
        lastUpdatedAt: FieldValue.serverTimestamp()
    };
    console.log(`/api/admin/form-settings: POST - Attempting to save settings for formType: ${formType} with payload:`, updatePayload);

    await docRef.set(updatePayload, { merge: true });
    console.log(`/api/admin/form-settings: POST - Settings for formType ${formType} updated successfully.`);
    return NextResponse.json({ message: `${formType} settings updated successfully` });

  } catch (error: any) {
    console.error('Error updating settings (/api/admin/form-settings POST):', error);
    return NextResponse.json({ error: { message: 'Failed to update settings', details: error.message, code: error.code || 'UPDATE_SETTINGS_ERROR' } }, { status: 500 });
  }
}
