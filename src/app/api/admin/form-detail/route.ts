
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { Timestamp } from 'firebase-admin/firestore';

function convertTimestamps(data: any): any {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  if (typeof data === 'object' && data !== null) {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertTimestamps(data[key]);
    }
    return newData;
  }
  return data;
}


export async function GET(request: NextRequest) {
  console.log("/api/admin/form-detail: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/form-detail: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('id');
  const formType = searchParams.get('type');

  if (!formId || !formType) {
    return NextResponse.json({ error: { message: 'Missing formId or formType parameter' } }, { status: 400 });
  }
  console.log(`/api/admin/form-detail: GET - Fetching details for formId: ${formId}, formType: ${formType}`);

  let collectionName = '';
  switch (formType) {
    case 'Admission':
      collectionName = 'admissionForms';
      break;
    case 'Course Registration':
      collectionName = 'courseRegistrations';
      break;
    case 'Custom Form': // Ensure this matches the string used on the client
      collectionName = 'customFormSubmissions';
      break;
    default:
      return NextResponse.json({ error: { message: 'Invalid form type' } }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection(collectionName).doc(formId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      console.log(`/api/admin/form-detail: GET - No form found for formId: ${formId} in collection: ${collectionName}`);
      return NextResponse.json({ error: { message: 'Form not found' } }, { status: 404 });
    }
    
    const formData = docSnap.data();
    const processedData = convertTimestamps(formData);

    console.log(`/api/admin/form-detail: GET - Successfully fetched form details for formId: ${formId}`);
    return NextResponse.json({ form: processedData });

  } catch (error: any) {
    console.error(`Error fetching form details for formId ${formId} (${formType}) (/api/admin/form-detail GET):`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch form details.', details: error.message } }, { status: 500 });
  }
}
