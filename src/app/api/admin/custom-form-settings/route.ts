
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { FieldValue } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';

const SETTINGS_COLLECTION = 'customFormSettings';

export async function GET(request: NextRequest) {
  console.log("/api/admin/custom-form-settings: GET request received");
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('/api/admin/custom-form-settings: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('formId');

  if (!formId) {
    console.log('/api/admin/custom-form-settings: GET - Bad Request: Missing formId parameter.');
    return NextResponse.json({ error: { message: 'Missing formId parameter' } }, { status: 400 });
  }
  console.log(`/api/admin/custom-form-settings: GET - Fetching settings for formId: ${formId}`);

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formId);
    const doc = await docRef.get();

    const defaultSettings = {
      title: "Custom Inquiry Form",
      description: "Please provide details for your custom inquiry.",
      isActive: false,
      fields: [],
    };

    if (!doc.exists) {
      console.log(`/api/admin/custom-form-settings: GET - No settings found for formId: ${formId}, returning defaults.`);
      return NextResponse.json({ settings: defaultSettings });
    }
    console.log(`/api/admin/custom-form-settings: GET - Successfully fetched settings for formId: ${formId}`);
    return NextResponse.json({ settings: doc.data() || defaultSettings });
  } catch (error: any) {
    console.error(`Error fetching custom form settings for formId ${formId} (/api/admin/custom-form-settings GET):`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch custom form settings.', details: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("/api/admin/custom-form-settings: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/admin/custom-form-settings: POST - Auth Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Auth).' } }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/admin/custom-form-settings: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }
  
  // IMPORTANT: Add admin authentication/authorization here for production
  // For example, verify Firebase ID token and check for admin custom claim
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ')) {
  //   return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  // }
  // const idToken = authorization.split('Bearer ')[1];
  // try {
  //   const decodedToken = await adminAuth.verifyIdToken(idToken);
  //   if (!decodedToken.admin) { // Assuming you set an 'admin' custom claim
  //     return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
  //   }
  // } catch (error) {
  //   return NextResponse.json({ error: { message: 'Unauthorized', details: 'Invalid token' } }, { status: 401 });
  // }

  try {
    const { formId, settings } = await request.json();
    console.log("/api/admin/custom-form-settings: POST - Received data:", { formId, settings });

    if (!formId || !settings) {
      console.log('/api/admin/custom-form-settings: POST - Validation failed: Missing formId or settings in request body.');
      return NextResponse.json({ error: {message: 'Missing formId or settings in request body'} }, { status: 400 });
    }
    if (typeof settings.title !== 'string' || typeof settings.isActive !== 'boolean' || !Array.isArray(settings.fields)) {
      console.log('/api/admin/custom-form-settings: POST - Validation failed: Invalid settings structure.');
      return NextResponse.json({ error: {message: 'Invalid settings structure'} }, { status: 400 });
    }


    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formId);
    const dataToSave = {
      ...settings,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      // updatedBy: decodedToken.uid // Add if you implement admin auth
    };

    await docRef.set(dataToSave, { merge: true });
    console.log(`/api/admin/custom-form-settings: POST - Settings for formId ${formId} saved successfully.`);
    return NextResponse.json({ message: 'Custom form settings saved successfully' });
  } catch (error: any) {
    console.error(`Error saving custom form settings (/api/admin/custom-form-settings POST):`, error);
    return NextResponse.json({ error: { message: 'Failed to save custom form settings.', details: error.message } }, { status: 500 });
  }
}
