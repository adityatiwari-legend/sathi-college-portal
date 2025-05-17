
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const SETTINGS_COLLECTION = 'customFormSettings'; // Collection to store custom form definitions

export async function GET(request: NextRequest) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: { message: 'Firestore Admin service not available.' } }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('formId');

  if (!formId) {
    return NextResponse.json({ error: { message: 'formId query parameter is required.' } }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Return a default structure if no settings exist, allowing the admin UI to populate defaults
      return NextResponse.json({
        settings: {
          title: "Custom Form",
          description: "Please fill out this custom form.",
          isActive: false,
          fields: [{ fieldKey: "field1", label: "Field 1", type: "text", isRequired: false }]
        }
      });
    }
    
    return NextResponse.json({ settings: doc.data() });
  } catch (error: any) {
    console.error(`Error fetching settings for custom form ${formId}:`, error);
    return NextResponse.json({ error: { message: `Failed to fetch settings for ${formId}`, details: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: { message: 'Firestore Admin service not available.' } }, { status: 500 });
  }
  
  // TODO: Implement proper admin authentication/authorization here.

  try {
    const settingsData = await request.json();
    const { formId, ...dataToSave } = settingsData;

    if (!formId || typeof formId !== 'string') {
      return NextResponse.json({ error: { message: 'formId is missing or invalid in the request body.' } }, { status: 400 });
    }

    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(formId);
    
    const updatePayload = {
        ...dataToSave,
        lastUpdatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(updatePayload, { merge: true });
    return NextResponse.json({ message: `Custom form '${formId}' settings updated successfully` });
  } catch (error: any) {
    console.error('Error updating custom form settings:', error);
    return NextResponse.json({ error: { message: 'Failed to update custom form settings', details: error.message } }, { status: 500 });
  }
}
