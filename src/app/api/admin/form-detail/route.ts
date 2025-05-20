
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  console.log("/api/admin/form-detail: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/form-detail: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  // TODO: Implement proper admin authentication/authorization for this route
  
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('id');
  const formType = searchParams.get('type');

  if (!formId || !formType) {
    return NextResponse.json({ error: { message: 'Missing formId or formType query parameter.' } }, { status: 400 });
  }

  let collectionName: string;
  switch (formType) {
    case 'Admission':
      collectionName = 'admissionForms';
      break;
    case 'Course Registration':
      collectionName = 'courseRegistrations';
      break;
    case 'Custom Form':
      collectionName = 'customFormSubmissions';
      break;
    default:
      return NextResponse.json({ error: { message: 'Invalid formType.' } }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection(collectionName).doc(formId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: { message: `Form with ID ${formId} of type ${formType} not found.` } }, { status: 404 });
    }

    const formData = docSnap.data();
    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const processedData = Object.entries(formData || {}).reduce((acc, [key, value]) => {
      if (value instanceof Timestamp) {
        acc[key] = value.toDate().toISOString();
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    console.log(`/api/admin/form-detail: GET - Successfully fetched form ${formId} of type ${formType}.`);
    return NextResponse.json({ id: docSnap.id, ...processedData, formType }); // Include formType in response for clarity
  } catch (error: any) {
    console.error(`Error fetching form ${formId} of type ${formType}:`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch form details', details: error.message } }, { status: 500 });
  }
}
