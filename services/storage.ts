
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase.ts';
import { Document, User, ChatSession, SyncStatus } from '../types.ts';

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const THEME_KEY = 'finan_gpt_theme';

export const StorageService = {
  // Theme (still in localStorage as it's a UI preference)
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
  },

  // Connection Test
  testConnection: async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
    }
  },

  // Documents
  getDocuments: (userId: string, callback: (docs: Document[]) => void) => {
    const path = 'documents';
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('uploadDate', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          uploadDate: data.uploadDate instanceof Timestamp ? data.uploadDate.toDate() : new Date(data.uploadDate),
          metadata: data.metadata ? {
            ...data.metadata,
            lastSync: data.metadata.lastSync instanceof Timestamp ? data.metadata.lastSync.toDate() : (data.metadata.lastSync ? new Date(data.metadata.lastSync) : undefined)
          } : undefined
        } as Document;
      });
      callback(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  saveDocument: async (docData: Document) => {
    const user = auth.currentUser;
    if (!user) return;
    const path = `documents/${docData.id}`;
    try {
      await setDoc(doc(db, 'documents', docData.id), {
        ...docData,
        userId: user.uid,
        uploadDate: Timestamp.fromDate(docData.uploadDate),
        metadata: docData.metadata ? {
          ...docData.metadata,
          lastSync: docData.metadata.lastSync ? Timestamp.fromDate(docData.metadata.lastSync) : null
        } : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteDocument: async (id: string) => {
    const path = `documents/${id}`;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // User
  getUser: async (userId: string): Promise<User | null> => {
    const path = `users/${userId}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  setUser: async (user: User) => {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  clearAll: () => {
    // Local storage cleanup if any
  },

  syncWithCloud: () => {
    // No longer needed with real-time Firestore
  },

  // Chat Sessions
  getChatSessions: (userId: string, type: string, callback: (sessions: ChatSession[]) => void) => {
    const path = 'chatSessions';
    const q = query(
      collection(db, path), 
      where('userId', '==', userId), 
      where('type', '==', type),
      orderBy('lastUpdate', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          lastUpdate: data.lastUpdate instanceof Timestamp ? data.lastUpdate.toDate() : new Date(data.lastUpdate),
          deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : (data.deletedAt ? new Date(data.deletedAt) : undefined),
          syncedAt: data.syncedAt instanceof Timestamp ? data.syncedAt.toDate() : (data.syncedAt ? new Date(data.syncedAt) : undefined),
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp instanceof Timestamp ? m.timestamp.toDate() : new Date(m.timestamp)
          }))
        } as ChatSession;
      });
      callback(sessions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  saveChatSession: async (session: ChatSession, type: string, userId: string) => {
    const path = `chatSessions/${session.id}`;
    try {
      await setDoc(doc(db, 'chatSessions', session.id), {
        ...session,
        type,
        userId,
        lastUpdate: Timestamp.fromDate(session.lastUpdate),
        deletedAt: session.deletedAt ? Timestamp.fromDate(session.deletedAt) : null,
        syncedAt: Timestamp.now(),
        messages: session.messages.map(m => ({
          ...m,
          timestamp: Timestamp.fromDate(m.timestamp)
        }))
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteChatSession: async (id: string) => {
    const path = `chatSessions/${id}`;
    try {
      await updateDoc(doc(db, 'chatSessions', id), {
        deletedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  restoreChatSession: async (id: string) => {
    const path = `chatSessions/${id}`;
    try {
      await updateDoc(doc(db, 'chatSessions', id), {
        deletedAt: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePermanently: async (id: string) => {
    const path = `chatSessions/${id}`;
    try {
      await deleteDoc(doc(db, 'chatSessions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  togglePin: async (id: string, isPinned: boolean) => {
    const path = `chatSessions/${id}`;
    try {
      await updateDoc(doc(db, 'chatSessions', id), {
        isPinned: !isPinned
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
