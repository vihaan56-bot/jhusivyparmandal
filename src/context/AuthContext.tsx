import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';

export type UserRole = 'root' | 'admin' | 'member' | 'guest';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL?: string;
  role: UserRole;
  needsPasswordChange?: boolean;
  disabled?: boolean;
  createdAt: string;
}

export interface UserMembership {
  id: string;
  associationId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes' | 'suspended';
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
  rejectionReason?: string;
  needsChangesReason?: string;
  suspensionReason?: string;
  membershipExpiry: string;
  membershipCardNumber: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  membership: UserMembership | null; // Single shop for legacy code support
  shops: UserMembership[]; // All shops owned by the user
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<any>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isRoot: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isVisitor: boolean;
  changeSimulatedRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId } = useTenant();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [shops, setShops] = useState<UserMembership[]>([]);
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
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.displayName || 'VM'}`,
            role: 'member',
            createdAt: new Date().toISOString()
          });
        }
        
        // Fetch role from custom claims
        let userRole: UserRole = profile.role || 'member';
        const userObj = firebaseUser as any;
        if (userObj.getIdTokenResult) {
          try {
            const tokenResult = await userObj.getIdTokenResult(true);
            if (tokenResult.claims.role) {
              userRole = tokenResult.claims.role as UserRole;
              
              // Sync role field in profile if claims changed
              if (profile.role !== userRole) {
                profile.role = userRole;
                await dataService.createUserProfile(profile);
              }
            }
          } catch (e) {
            console.error('Error fetching custom claims:', e);
          }
        }
        
        setUser(profile);
        setRole(userRole);

        // Fetch memberships/shops for the user
        if (tenantId) {
          const memberships = await dataService.getMemberships(tenantId);
          const userShops = memberships.filter((m: any) => m.userId === firebaseUser.uid);
          setShops(userShops);
          
          // Legacy support: set membership to the first active/approved shop, or first shop
          const activeShop = userShops.find((s: any) => s.status === 'approved' || s.status === 'active') || userShops[0] || null;
          setMembership(activeShop);
        } else {
          setShops([]);
          setMembership(null);
        }
      } else {
        setUser(null);
        setRole('guest');
        setShops([]);
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
      const profile: UserProfile = {
        uid: newUser.uid,
        email: email,
        displayName: name,
        phoneNumber: phone,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        role: 'member',
        createdAt: new Date().toISOString()
      };
      await dataService.createUserProfile(profile);
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
    return roles.includes(role);
  };

  const isRoot = role === 'root';
  const isAdmin = role === 'admin' || role === 'root';
  const isMember = role === 'member' || role === 'admin' || role === 'root';
  const isVisitor = role === 'guest';

  // Direct mock bypass for developers to change roles instantly
  const changeSimulatedRole = async (newRole: UserRole) => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedProfile = { ...user, role: newRole };
      await dataService.createUserProfile(updatedProfile);
      setUser(updatedProfile);
      setRole(newRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        membership,
        shops,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithPhone,
        loginWithGoogle,
        logout,
        hasRole,
        isRoot,
        isAdmin,
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
