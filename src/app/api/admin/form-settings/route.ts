
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { FieldValue } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';

const SETTINGS_COLLECTION = 'formSettings'; // Changed from 'settings'

export async function GET(request: NextRequest) {
  console.log("/api/admin/form-settings: GET request received");
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('/api/admin/form-settings: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const formType = searchParams.get('formType');

  if (!formType) {
    console.log('/api/admin/form-settings: GET - Bad Request: Missing formType parameter.');
    return NextResponse.json({ error: {message: 'Missing formType parameter'} }, { status: 400 });
  }
   console.log(`/api/admin/form-settings: GET - Fetching settings for formType: ${formType}`);

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formType);
    const doc = await docRef.get();
    
    const defaultSettings = { 
        title: `Default ${formType.charAt(0).toUpperCase() + formType.slice(1)} Form Title`, 
        description: `Default description for ${formType}.`, 
        isActive: false 
    };

    if (!doc.exists) {
      console.log(`/api/admin/form-settings: GET - No settings found for formType: ${formType}, returning defaults.`);
      return NextResponse.json({ settings: defaultSettings });
    }
    console.log(`/api/admin/form-settings: GET - Successfully fetched settings for formType: ${formType}`);
    return NextResponse.json({ settings: doc.data() || defaultSettings });
  } catch (error: any) {
    console.error(`Error fetching form settings for formType ${formType} (/api/admin/form-settings GET):`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch form settings.', details: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("/api/admin/form-settings: POST request received");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    console.error('/api/admin/form-settings: POST - Auth Admin service not available.');
    return NextResponse.json({ error: {message: 'Firebase Admin SDK not initialized (Auth).'} }, { status: 500 });
  }
  if (!adminDb) {
    console.error('/api/admin/form-settings: POST - Firestore Admin service not available.');
    return NextResponse.json({ error: {message: 'Firebase Admin SDK not initialized (Firestore).'} }, { status: 500 });
  }
  
  // TODO: Implement actual admin role check here using custom claims if needed for production
  // For now, any authenticated user can call this if they have a valid token.
  // This is a security risk in production if not properly secured.
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ')) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // const idToken = authorization.split('Bearer ')[1];
  // let decodedToken: DecodedIdToken;
  // try {
  //   decodedToken = await adminAuth.verifyIdToken(idToken);
  //   // if (!decodedToken.admin) { // Check for an admin custom claim
  //   //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  //   // }
  // } catch (error: any) {
  //   return NextResponse.json({ error: 'Unauthorized: Invalid token', details: error.message }, { status: 401 });
  // }

  try {
    const { formType, settings } = await request.json();
    console.log("/api/admin/form-settings: POST - Received data:", { formType, settings });

    if (!formType || !settings) {
      console.log('/api/admin/form-settings: POST - Validation failed: Missing formType or settings in request body.');
      return NextResponse.json({ error: {message: 'Missing formType or settings in request body'} }, { status: 400 });
    }
    if (typeof settings.title !== 'string' || typeof settings.isActive !== 'boolean') {
       console.log('/api/admin/form-settings: POST - Validation failed: Invalid settings structure.');
      return NextResponse.json({ error: {message: 'Invalid settings structure (title or isActive missing/wrong type)'} }, { status: 400 });
    }


    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formType);
    const dataToUpdate = {
      title: settings.title,
      description: settings.description || "", // Ensure description is at least an empty string
      isActive: settings.isActive,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      // updatedBy: decodedToken.uid, // If admin auth is implemented
    };

    await docRef.set(dataToUpdate, { merge: true }); // Use merge to avoid overwriting other potential fields
    console.log(`/api/admin/form-settings: POST - Settings for formType ${formType} saved successfully.`);
    return NextResponse.json({ message: 'Form settings saved successfully' });
  } catch (error: any) {
    console.error(`Error saving form settings (/api/admin/form-settings POST):`, error);
    return NextResponse.json({ error: { message: 'Failed to save form settings.', details: error.message } }, { status: 500 });
  }
}
