// Firebase Auth Service abstraction supporting standard Firebase & local mock modes
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;
let firebaseAuth: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(app);
  } catch (error) {
    console.error('Firebase Auth initialization failed:', error);
  }
}

// Mock User Implementation
interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

type AuthCallback = (user: MockFirebaseUser | null) => void;

class MockAuthService {
  private listeners: AuthCallback[] = [];
  private currentUser: MockFirebaseUser | null = null;

  constructor() {
    // Check if we already have a session in localStorage
    const savedUser = localStorage.getItem('vyapar_mock_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  onAuthStateChanged(callback: AuthCallback) {
    this.listeners.push(callback);
    // Emit initial state
    setTimeout(() => {
      callback(this.currentUser);
    }, 50);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  async signInWithEmail(email: string, pass: string): Promise<MockFirebaseUser> {
    // Setup pre-defined demo accounts
    let displayName = 'Mohan Lal';
    let uid = 'user_mohan_lal';
    let phone = '+91 98765 43210';

    if (email.includes('admin')) {
      displayName = 'Super Admin (Rajesh Sharma)';
      uid = 'user_super_admin';
      phone = '+91 99999 88888';
    } else if (email.includes('president')) {
      displayName = 'President (Sunil Gupta)';
      uid = 'user_president';
      phone = '+91 98888 77777';
    } else if (email.includes('secretary')) {
      displayName = 'Secretary (Karan Johar)';
      uid = 'user_secretary';
      phone = '+91 97777 66666';
    } else if (email.includes('treasurer')) {
      displayName = 'Treasurer (Alok Verma)';
      uid = 'user_treasurer';
      phone = '+91 96666 55555';
    } else if (email.includes('member')) {
      displayName = 'Vijay Kirana Store';
      uid = 'user_member_vijay';
      phone = '+91 95555 44444';
    }

    const user: MockFirebaseUser = {
      uid,
      email,
      displayName,
      phoneNumber: phone,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
    };

    this.currentUser = user;
    localStorage.setItem('vyapar_mock_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async signInWithPhone(phoneNumber: string, otp: string): Promise<MockFirebaseUser> {
    const user: MockFirebaseUser = {
      uid: `phone_${phoneNumber.replace(/\s+/g, '')}`,
      email: null,
      displayName: `Phone User (${phoneNumber})`,
      phoneNumber,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(phoneNumber)}`
    };

    this.currentUser = user;
    localStorage.setItem('vyapar_mock_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async signInWithGoogle(): Promise<MockFirebaseUser> {
    const user: MockFirebaseUser = {
      uid: 'google_user_ramesh',
      email: 'ramesh.gupta@gmail.com',
      displayName: 'Ramesh Gupta',
      phoneNumber: '+91 91234 56789',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh'
    };

    this.currentUser = user;
    localStorage.setItem('vyapar_mock_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async signUpWithEmail(email: string, pass: string): Promise<MockFirebaseUser> {
    const user: MockFirebaseUser = {
      uid: `uid_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      email,
      displayName: email.split('@')[0],
      phoneNumber: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
    };
    this.currentUser = user;
    localStorage.setItem('vyapar_mock_user', JSON.stringify(user));
    
    const usersList = JSON.parse(localStorage.getItem('vyapar_users') || '[]');
    if (!usersList.some((u: any) => u.email === email)) {
      usersList.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL
      });
      localStorage.setItem('vyapar_users', JSON.stringify(usersList));
    }
    
    this.notify();
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('vyapar_mock_user');
    this.notify();
  }
}

// Wrapper routing calls to Firebase or mock
export const authService = {
  onAuthStateChanged: (callback: AuthCallback) => {
    if (isFirebaseConfigured && firebaseAuth) {
      return firebaseOnAuthStateChanged(firebaseAuth, callback);
    } else {
      const mock = new MockAuthService();
      return mock.onAuthStateChanged(callback);
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    if (isFirebaseConfigured && firebaseAuth) {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      return cred.user;
    } else {
      const mock = new MockAuthService();
      return mock.signInWithEmail(email, pass);
    }
  },

  signInWithPhone: async (phoneNumber: string, otp: string) => {
    if (isFirebaseConfigured && firebaseAuth) {
      // In production real Firebase uses RecaptchaVerifier and signInWithPhoneNumber
      // This is simplified but works with Firebase auth standard credential flows
      throw new Error('Phone login requires recaptcha setup. For local verification, disable VITE_FIREBASE_API_KEY.');
    } else {
      const mock = new MockAuthService();
      return mock.signInWithPhone(phoneNumber, otp);
    }
  },

  signInWithGoogle: async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      return cred.user;
    } else {
      const mock = new MockAuthService();
      return mock.signInWithGoogle();
    }
  },

  signUpWithEmail: async (email: string, pass: string) => {
    if (isFirebaseConfigured && firebaseAuth) {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      return cred.user;
    } else {
      const mock = new MockAuthService();
      return mock.signUpWithEmail(email, pass);
    }
  },

  signOut: async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    } else {
      const mock = new MockAuthService();
      await mock.signOut();
    }
  }
};
