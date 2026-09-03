import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  writeBatch,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { UserProfile, UserGoals, UserSettings } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App instance
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Initialize Firestore with specific database ID if configured
const customDbId = firebaseConfigJson.firestoreDatabaseId;
export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(firebaseApp, customDbId)
  : getFirestore(firebaseApp);

// Auth helper functions
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Initialize doc in Firestore if first time
  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    const now = new Date().toISOString();
    const initialProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'UPSC Aspirant',
      upscYear: '2026',
      targetService: 'IAS',
      optionalSubject: 'PSIR',
      createdAt: now,
      updatedAt: now,
    };

    const initialGoals: UserGoals = {
      dailyTargetHours: 6,
      weeklyTargetHours: 36,
      minStreakMinutes: 30,
    };

    const initialSettings: UserSettings = {
      theme: 'dark',
      soundEnabled: true,
      ambientSound: 'none',
      ambientVolume: 0.4,
      notifications: {
        dailyReminder: true,
        dailyReminderTime: '08:00',
        goalReminder: true,
        breakReminder: true,
        breakIntervalMinutes: 50,
        endOfDayReview: true,
        endOfDayReviewTime: '22:00',
      },
    };

    await setDoc(userDocRef, {
      profile: initialProfile,
      goals: initialGoals,
      settings: initialSettings,
      updatedAt: now,
    });
  }

  return user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  extra: { upscYear?: string; targetService?: string; optionalSubject?: string }
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;

  if (displayName.trim()) {
    await updateFirebaseProfile(user, {
      displayName: displayName.trim(),
    });
  }

  // Create initial user doc in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  
  const initialProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName.trim() || 'UPSC Aspirant',
    upscYear: extra.upscYear || '2026',
    targetService: extra.targetService || 'IAS',
    optionalSubject: extra.optionalSubject || 'PSIR',
    createdAt: now,
    updatedAt: now,
  };

  const initialGoals: UserGoals = {
    dailyTargetHours: 6,
    weeklyTargetHours: 36,
    minStreakMinutes: 30,
  };

  const initialSettings: UserSettings = {
    theme: 'dark',
    soundEnabled: true,
    ambientSound: 'none',
    ambientVolume: 0.4,
    notifications: {
      dailyReminder: true,
      dailyReminderTime: '08:00',
      goalReminder: true,
      breakReminder: true,
      breakIntervalMinutes: 50,
      endOfDayReview: true,
      endOfDayReviewTime: '22:00',
    },
  };

  await setDoc(userDocRef, {
    profile: initialProfile,
    goals: initialGoals,
    settings: initialSettings,
    updatedAt: now,
  });

  return user;
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return userCredential.user;
}

export async function loginDemoAccount(aspirantName: string = 'Nishant Raj'): Promise<FirebaseUser | { uid: string; email: string; displayName: string; isLocal: boolean }> {
  const demoEmail = `aspirant.${aspirantName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo'}@studyos.local`;
  const demoPassword = 'StudyOSDemoPass2026!';

  try {
    const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    return userCredential.user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        return await registerWithEmail(demoEmail, demoPassword, aspirantName, {
          upscYear: '2026',
          targetService: 'IAS',
          optionalSubject: 'PSIR',
        });
      } catch (regErr: any) {
        // Fallback to local user
      }
    }
    // Return local demo user if email auth is not allowed on Firebase
    return {
      uid: `local_${aspirantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      email: demoEmail,
      displayName: aspirantName,
      isLocal: true,
    };
  }
}

export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export { onAuthStateChanged };
export type { FirebaseUser };
