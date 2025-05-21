
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-sdk'; // UPDATED IMPORT PATH
import { Timestamp } from 'firebase-admin/firestore';

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form';
  userId: string;
  userEmail?: string;
  submittedAt: string | null; // ISO string
  details?: any; // Store original form data or a summary
  status?: string; // e.g., 'Pending', 'Approved', 'Rejected'
}

export async function GET(request: NextRequest) {
  console.log("/api/admin/all-forms: GET request received");
  const adminDb = getAdminDb();

  if (!adminDb) {
    console.error('/api/admin/all-forms: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }

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
         try { submittedAtISO = new Date(data.submittedAt).toISOString(); } catch (e) { /* ignore */ }
      }
      allForms.push({
        id: doc.id,
        formType: 'Admission',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: submittedAtISO,
        details: { fullName: data.fullName, desiredProgram: data.desiredProgram },
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
        try { registeredAtISO = new Date(regAt).toISOString(); } catch (e) { /* ignore */ }
      }
      allForms.push({
        id: doc.id,
        formType: 'Course Registration',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: registeredAtISO,
        details: { studentName: data.studentName, studentId: data.studentId, term: data.term, selectedCourses: data.selectedCourses },
        status: data.status || 'Submitted',
      });
    });
    
    // Fetch Custom Form Submissions
    const customFormSnapshot = await adminDb.collection('customFormSubmissions').orderBy('submittedAt', 'desc').get();
    customFormSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let submittedAtISO: string | null = null;
      if (data.submittedAt && data.submittedAt instanceof Timestamp) {
        submittedAtISO = data.submittedAt.toDate().toISOString();
      } else if (data.submittedAt && typeof data.submittedAt === 'string') {
         try { submittedAtISO = new Date(data.submittedAt).toISOString(); } catch (e) { /* ignore */ }
      }
      allForms.push({
        id: doc.id,
        formType: 'Custom Form',
        userId: data.userId || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        submittedAt: submittedAtISO,
        details: { formId: data.formId, fieldCount: data.formData ? Object.keys(data.formData).length : 0 }, // Example summary
        status: data.status || 'Submitted',
      });
    });


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
