
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form';
  userId: string;
  userEmail?: string;
  submittedAt: string | null; 
  details?: any; 
  status?: string; 
  formId?: string; // For custom forms
  title?: string; // For custom forms, title from definition
}

export async function GET(request: NextRequest) {
  console.log("/api/admin/all-forms: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/all-forms: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

  // TODO: Implement proper admin authentication/authorization for this route
  
  try {
    const allForms: SubmittedForm[] = [];

    // Fetch Admission Forms
    const admissionSnapshot = await adminDb.collection('admissionForms').orderBy('submittedAt', 'desc').get();
    admissionSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let submittedAtISO: string | null = null;
      if (data.submittedAt && data.submittedAt instanceof Timestamp) {
        submittedAtISO = data.submittedAt.toDate().toISOString();
      } else if (data.submittedAt && typeof data.submittedAt === 'string') {
         try {
          submittedAtISO = new Date(data.submittedAt).toISOString();
        } catch (e) { /* ignore if not a valid date string */ }
      }

      allForms.push({
        id: doc.id,
        formType: 'Admission',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: submittedAtISO,
        details: { 
          fullName: data.fullName, 
          desiredProgram: data.desiredProgram,
          dateOfBirth: data.dateOfBirth, 
        },
        status: data.status || 'Submitted',
      });
    });

    // Fetch Course Registrations
    const courseRegSnapshot = await adminDb.collection('courseRegistrations').orderBy('registeredAt', 'desc').get();
    courseRegSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let registeredAtISO: string | null = null;
      const regAt = data.registeredAt || data.submittedAt; 
      if (regAt && regAt instanceof Timestamp) {
        registeredAtISO = regAt.toDate().toISOString();
      } else if (regAt && typeof regAt === 'string') {
        try {
          registeredAtISO = new Date(regAt).toISOString();
        } catch (e) { /* ignore */ }
      }
      
      allForms.push({
        id: doc.id,
        formType: 'Course Registration',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: registeredAtISO,
        details: { 
          studentName: data.studentName, 
          studentId: data.studentId,
          term: data.term, 
          selectedCourses: data.selectedCourses 
        },
        status: data.status || 'Submitted',
      });
    });

    // Fetch Custom Form Submissions
    const customFormSnapshot = await adminDb.collection('customFormSubmissions').orderBy('submittedAt', 'desc').get();
    
    // Need to fetch form definitions to get titles for custom forms
    const customFormDefinitions = new Map<string, {title?: string}>();
    const formDefsSnapshot = await adminDb.collection('customFormSettings').get();
    formDefsSnapshot.forEach(defDoc => {
        customFormDefinitions.set(defDoc.id, { title: defDoc.data().title });
    });

    customFormSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let submittedAtISO: string | null = null;
      if (data.submittedAt && data.submittedAt instanceof Timestamp) {
        submittedAtISO = data.submittedAt.toDate().toISOString();
      } else if (data.submittedAt && typeof data.submittedAt === 'string') {
         try {
          submittedAtISO = new Date(data.submittedAt).toISOString();
        } catch (e) { /* ignore */ }
      }
      
      const formDefinition = customFormDefinitions.get(data.formId);

      allForms.push({
        id: doc.id,
        formType: 'Custom Form',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: submittedAtISO,
        details: { formData: data.formData }, // Storing the actual form data object
        status: data.status || 'Submitted',
        formId: data.formId,
        title: formDefinition?.title || data.formId // Use definition title or fallback to formId
      });
    });


    // Sort all forms together by submission date, most recent first
    allForms.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`/api/admin/all-forms: GET - Successfully fetched ${allForms.length} total forms.`);
    return NextResponse.json(allForms);
  } catch (error: any) {
    console.error('Error fetching all submitted forms (/api/admin/all-forms GET):', error);
    return NextResponse.json({ error: { message: 'Failed to fetch forms', details: error.message } }, { status: 500 });
  }
}

