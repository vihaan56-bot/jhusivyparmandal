// rbacService.ts - Centralized Role-Based Access Control logic
export type SystemRole = 'root' | 'admin' | 'member' | 'guest';

export const rbacService = {
  /**
   * Root User: There must always be exactly ONE Root User.
   * Root can manage Admins, perform all administrative tasks, and view everything.
   */
  canManageAdmins(role: SystemRole): boolean {
    return role === 'root';
  },

  /**
   * Admins can manage all operational data, but cannot manage other Admins or Root.
   * Root also shares operational management capabilities.
   */
  canManageShops(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageAnnouncements(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageMeetings(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageEvents(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageComplaints(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageDocuments(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageCampaigns(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  canManageFutureModules(role: SystemRole): boolean {
    return role === 'root' || role === 'admin';
  },

  /**
   * Shop Visibility Rules:
   * Approved shops are public (anyone can view).
   * Pending/Rejected/Needs_Changes/Suspended shops are restricted to: Root, Admins, and the Shop Owner.
   */
  canViewShop(role: SystemRole, shopStatus: string, currentUserId?: string, shopOwnerId?: string): boolean {
    if (shopStatus === 'approved' || shopStatus === 'active') {
      return true; // Publicly visible
    }
    
    // Restricted shops require authentication
    if (!currentUserId || !role) return false;
    
    return (
      role === 'root' ||
      role === 'admin' ||
      (role === 'member' && currentUserId === shopOwnerId)
    );
  },

  /**
   * Members can add one or more shops.
   */
  canAddShop(role: SystemRole): boolean {
    return role === 'member';
  },

  /**
   * Members can edit their own profiles.
   * Root can manage/modify Admin accounts.
   */
  canEditProfile(role: SystemRole, currentUserId: string, targetUserId: string, targetUserRole?: SystemRole): boolean {
    if (currentUserId === targetUserId) {
      return true; // Self editing is always allowed
    }
    if (role === 'root' && targetUserRole === 'admin') {
      return true; // Root can edit Admins
    }
    return false;
  },

  /**
   * Audit log access: Restricted to Root User only.
   */
  canViewAuditLogs(role: SystemRole): boolean {
    return role === 'root';
  }
};
