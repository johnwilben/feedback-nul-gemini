import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import { Feedback, FeedbackStatus, FeedbackCategory } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const { auth } = await getFirebase();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) {
  const { db } = await getFirebase();
  if (!db) throw new Error("Database not connected");

  const path = 'feedbacks';
  
  try {
    const feedbackData = {
      ...feedback,
      status: FeedbackStatus.PENDING,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, path), feedbackData);
    return docRef.id;
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    await handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getFeedbacks() {
  const { db } = await getFirebase();
  if (!db) throw new Error("Database not connected");

  const path = 'feedbacks';
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  } catch (error) {
    await handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getMyFeedbacks(userId: string, callback: (feedbacks: Feedback[]) => void) {
  const { db } = await getFirebase();
  if (!db) return () => {};

  const q = query(
    collection(db, 'feedbacks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const feedbacks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Feedback));
    callback(feedbacks);
  });
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus, response?: string) {
  const { db } = await getFirebase();
  if (!db) throw new Error("Database not connected");

  const docRef = doc(db, 'feedbacks', id);
  await updateDoc(docRef, {
    status,
    ...(response && { response, responseAt: Date.now() })
  });
}
