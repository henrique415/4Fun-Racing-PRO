import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import app from './firebase';

export const auth = getAuth(app);

export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

// Provider principal para login seguro e sem bloqueios de escopo restrito
const loginProvider = new GoogleAuthProvider();
loginProvider.addScope('email');
loginProvider.addScope('profile');
loginProvider.addScope('openid');
loginProvider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track sign-in in progress
let isSigningIn = false;
// Cache the access token in memory (NEVER in localStorage)
let cachedAccessToken: string | null = null;
let currentGoogleUser: FirebaseUser | null = null;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token?: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    currentGoogleUser = user;
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || undefined);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: FirebaseUser;
  accessToken?: string;
  email: string;
  displayName: string;
  photoURL?: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, loginProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    currentGoogleUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken || undefined,
      email: result.user.email || '',
      displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário Google',
      photoURL: result.user.photoURL || undefined,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Solicita token com permissão de envio de e-mail via Gmail caso necessário
 */
export const requestGmailPermissions = async (): Promise<string | null> => {
  try {
    const gmailProvider = new GoogleAuthProvider();
    gmailProvider.addScope(GMAIL_SEND_SCOPE);
    const result = await signInWithPopup(auth, gmailProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    }
    return null;
  } catch (err) {
    console.warn('Falha ao obter escopo do Gmail:', err);
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const getGoogleUser = (): FirebaseUser | null => {
  return currentGoogleUser || auth.currentUser;
};

export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  currentGoogleUser = null;
};
