
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin-sdk';
import { Timestamp } from 'firebase-admin/firestore';

interface AdminNotification {
  id: string;
  message: string;
  type: string;
  timestamp: string | null; // ISO string
  isRead: boolean;
  userId?: string;
  userEmail?: string;
  relatedFormId?: string;
  relatedFormType?: string;
}

export async function GET(request: NextRequest) {
  console.log("/api/admin/notifications: GET request received");
  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth(); // For future admin role check

  if (!adminDb) {
    console.error('/api/admin/notifications: GET - Firestore Admin service not available.');
    return NextResponse.json({ error: { message: 'Firebase Admin SDK not initialized (Firestore).' } }, { status: 500 });
  }
  
  // TODO: IMPORTANT - Implement admin authentication/authorization check here
  // For example, verify ID token and check for an admin custom claim
  // const authorization = request.headers.get('Authorization');
  // if (!authorization?.startsWith('Bearer ')) { /* ... return 401 ... */ }
  // const idToken = authorization.split('Bearer ')[1];
  // try {
  //   const decodedToken = await adminAuth.verifyIdToken(idToken);
  //   if (!decodedToken.admin) { /* ... return 403 ... */ }
  // } catch (error) { /* ... return 401 ... */ }


  try {
    const snapshot = await adminDb.collection('adminNotifications')
                                .orderBy('timestamp', 'desc')
                                .limit(50) // Limit to a reasonable number for display
                                .get();
    
    const notifications: AdminNotification[] = snapshot.docs.map(doc => {
      const data = doc.data();
      let timestampISO: string | null = null;
      if (data.timestamp && data.timestamp instanceof Timestamp) {
        timestampISO = data.timestamp.toDate().toISOString();
      } else if (data.timestamp && typeof data.timestamp === 'string') {
        try { timestampISO = new Date(data.timestamp).toISOString(); } catch (e) { /* ignore */ }
      }
      return {
        id: doc.id,
        message: data.message || "No message content.",
        type: data.type || "general",
        timestamp: timestampISO,
        isRead: data.isRead || false,
        userId: data.userId,
        userEmail: data.userEmail,
        relatedFormId: data.relatedFormId,
        relatedFormType: data.relatedFormType,
      };
    });
    
    console.log(`/api/admin/notifications: GET - Successfully fetched ${notifications.length} admin notifications.`);
    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Error fetching admin notifications (/api/admin/notifications GET):', error);
    return NextResponse.json({ error: { message: 'Failed to fetch admin notifications', details: error.message } }, { status: 500 });
  }
}
