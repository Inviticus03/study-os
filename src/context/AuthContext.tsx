import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail,
  logOutUser,
  sendResetPassword,
  loginDemoAccount,
  onAuthStateChanged,
} from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginGoogle: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (
    email: string,
    pass: string,
    displayName: string,
    extra: { upscYear?: string; targetService?: string; optionalSubject?: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginDemo: (name?: string) => Promise<void>;
  loginGuest: (name?: string, email?: string, extra?: { upscYear?: string; targetService?: string; optionalSubject?: string }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('studyos_current_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('studyos_current_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        const p = localStorage.getItem(`studyos_profile_${u.uid}`);
        if (p) return JSON.parse(p);
      }
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        const authUserData: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'UPSC Aspirant',
          photoURL: firebaseUser.photoURL,
          isLocal: false,
        };
        setUser(authUserData);
        localStorage.setItem('studyos_current_auth_user', JSON.stringify(authUserData));

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Real-time listener for user profile doc
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data?.profile) {
                setProfile(data.profile as UserProfile);
                localStorage.setItem(`studyos_profile_${firebaseUser.uid}`, JSON.stringify(data.profile));
              } else {
                const fallbackProfile: UserProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || 'UPSC Aspirant',
                  upscYear: '2026',
                  targetService: 'IAS',
                  optionalSubject: 'PSIR',
                  createdAt: new Date().toISOString(),
                };
                setProfile(fallbackProfile);
                localStorage.setItem(`studyos_profile_${firebaseUser.uid}`, JSON.stringify(fallbackProfile));
              }
            } else {
              const initialProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'UPSC Aspirant',
                upscYear: '2026',
                targetService: 'IAS',
                optionalSubject: 'PSIR',
                createdAt: new Date().toISOString(),
              };
              setDoc(userDocRef, {
                profile: initialProfile,
                updatedAt: new Date().toISOString(),
              }, { merge: true }).catch(() => {});
              setProfile(initialProfile);
              localStorage.setItem(`studyos_profile_${firebaseUser.uid}`, JSON.stringify(initialProfile));
            }
            setIsLoading(false);
          },
          (error) => {
            console.warn('Profile sync fallback:', error);
            setIsLoading(false);
          }
        );
      } else {
        // If not logged in via Firebase, check if local user session exists
        try {
          const savedLocal = localStorage.getItem('studyos_current_auth_user');
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (parsed?.isLocal) {
              setUser(parsed);
              const p = localStorage.getItem(`studyos_profile_${parsed.uid}`);
              if (p) setProfile(JSON.parse(p));
              setIsLoading(false);
              return;
            }
          }
        } catch {}
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const loginGuest = async (
    name: string = 'Nishant Raj',
    email?: string,
    extra?: { upscYear?: string; targetService?: string; optionalSubject?: string }
  ) => {
    setIsLoading(true);
    try {
      const cleanName = name.trim() || 'UPSC Aspirant';
      const uid = `local_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'aspirant'}`;
      const now = new Date().toISOString();
      const localUser: AuthUser = {
        uid,
        email: email?.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@studyos.local`,
        displayName: cleanName,
        isLocal: true,
      };

      const savedProfile = localStorage.getItem(`studyos_profile_${uid}`);
      let userProfile: UserProfile;
      if (savedProfile) {
        userProfile = {
          ...JSON.parse(savedProfile),
          displayName: cleanName,
          ...(extra?.upscYear ? { upscYear: extra.upscYear } : {}),
          ...(extra?.targetService ? { targetService: extra.targetService } : {}),
          ...(extra?.optionalSubject ? { optionalSubject: extra.optionalSubject } : {}),
          updatedAt: now,
        };
      } else {
        userProfile = {
          uid,
          email: localUser.email || '',
          displayName: cleanName,
          upscYear: extra?.upscYear || '2026',
          targetService: extra?.targetService || 'IAS',
          optionalSubject: extra?.optionalSubject || 'PSIR',
          createdAt: now,
          updatedAt: now,
        };
      }

      localStorage.setItem('studyos_current_auth_user', JSON.stringify(localUser));
      localStorage.setItem(`studyos_profile_${uid}`, JSON.stringify(userProfile));

      setUser(localUser);
      setProfile(userProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('studyos_current_auth_user');
      await loginWithGoogle();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('studyos_current_auth_user');
      await loginWithEmail(email, pass);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        // Transparent fallback to local workspace so user is never blocked
        await loginGuest(email.split('@')[0], email);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    displayName: string,
    extra: { upscYear?: string; targetService?: string; optionalSubject?: string }
  ) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('studyos_current_auth_user');
      await registerWithEmail(email, pass, displayName, extra);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        // Transparent fallback to local workspace
        await loginGuest(displayName || email.split('@')[0], email, extra);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('studyos_current_auth_user');
      if (user && !user.isLocal) {
        await logOutUser().catch(() => {});
      }
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendResetPassword(email);
  };

  const loginDemo = async (name: string = 'Nishant Raj') => {
    setIsLoading(true);
    try {
      await loginGuest(name);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const updatedProfile: UserProfile = {
      ...(profile || {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'UPSC Aspirant',
        upscYear: '2026',
        targetService: 'IAS',
        optionalSubject: 'PSIR',
        createdAt: now,
      }),
      ...data,
      updatedAt: now,
    };

    localStorage.setItem(`studyos_profile_${user.uid}`, JSON.stringify(updatedProfile));
    setProfile(updatedProfile);

    if (!user.isLocal) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          profile: updatedProfile,
          updatedAt: now,
        });
      } catch (err) {
        console.warn('Profile cloud sync error:', err);
      }
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    loginGoogle,
    login,
    register,
    logout,
    resetPassword,
    loginDemo,
    loginGuest,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

