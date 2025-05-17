
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration';
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

  // TODO: Implement proper admin authentication/authorization for this route
  // For now, it's open, relying on path obscurity or future network rules.

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
          dateOfBirth: data.dateOfBirth, // Already a string from client
        },
        status: data.status || 'Submitted',
      });
    });

    // Fetch Course Registrations
    const courseRegSnapshot = await adminDb.collection('courseRegistrations').orderBy('registeredAt', 'desc').get();
    courseRegSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let registeredAtISO: string | null = null;
      const regAt = data.registeredAt || data.submittedAt; // Use registeredAt first, fallback to submittedAt
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
