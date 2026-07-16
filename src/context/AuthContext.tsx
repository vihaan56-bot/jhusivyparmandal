import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'president' 
  | 'vice_president' 
  | 'secretary' 
  | 'treasurer' 
  | 'committee' 
  | 'business_member' 
  | 'visitor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL?: string;
  createdAt: string;
}

export interface UserMembership {
  id: string;
  associationId: string;
  userId: string;
  role: UserRole;
  status: 'pending' | 'active' | 'expired';
  shopName: string;
  category: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  googleMapsLink?: string;
  gstNumber?: string;
  businessDescription: string;
  businessImages: string[];
  products: string[];
  services: string[];
  membershipExpiry: string;
  membershipCardNumber: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  membership: UserMembership | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<any>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isCommittee: boolean;
  isMember: boolean;
  isVisitor: boolean;
  changeSimulatedRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId } = useTenant();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize authentication and association membership
  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create global user profile
        let profile = await dataService.getUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = await dataService.createUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Vyapar Member',
            phoneNumber: firebaseUser.phoneNumber || '',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.displayName || 'VM'}`
          });
        }
        setUser(profile);

        // Fetch membership for active association if we are inside a tenant scope
        if (tenantId) {
          const assocMembership = await dataService.getUserMembership(tenantId, firebaseUser.uid);
          setMembership(assocMembership);
        } else {
          setMembership(null);
        }
      } else {
        setUser(null);
        setMembership(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await authService.signInWithEmail(email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const newUser = await authService.signUpWithEmail(email, pass);
      await dataService.createUserProfile({
        uid: newUser.uid,
        email: email,
        displayName: name,
        phoneNumber: phone,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    setLoading(true);
    try {
      await authService.signInWithPhone(phone, otp);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    
    // Super admins always have full access anywhere
    if (membership?.role === 'super_admin') return true;

    // Check if membership is active and role matches
    if (!membership || membership.status !== 'active') {
      // Allow visitor access if roles includes visitor or public
      return roles.includes('visitor');
    }

    return roles.includes(membership.role);
  };

  // Rolled convenience getters
  const isAdmin = membership?.status === 'active' && [
    'super_admin', 'admin', 'president', 'secretary', 'treasurer'
  ].includes(membership.role) || false;

  const isCommittee = membership?.status === 'active' && [
    'super_admin', 'admin', 'president', 'vice_president', 'secretary', 'treasurer', 'committee'
  ].includes(membership.role) || false;

  const isMember = membership?.status === 'active' && [
    'super_admin', 'admin', 'president', 'vice_president', 'secretary', 'treasurer', 'committee', 'business_member'
  ].includes(membership.role) || false;

  const isVisitor = !user || !membership || membership.status !== 'active';

  // Direct mock bypass for developers to change roles instantly
  const changeSimulatedRole = async (newRole: UserRole) => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      await dataService.updateSimulatedRole(tenantId, user.uid, newRole);
      const updatedMemb = await dataService.getUserMembership(tenantId, user.uid);
      setMembership(updatedMemb);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithPhone,
        loginWithGoogle,
        logout,
        hasRole,
        isAdmin,
        isCommittee,
        isMember,
        isVisitor,
        changeSimulatedRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
