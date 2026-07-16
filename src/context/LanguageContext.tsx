import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

const translations = {
  en: {
    dashboard: 'Dashboard',
    directory: 'Member Directory',
    campaigns: 'Campaigns',
    complaints: 'Complaints',
    meetings: 'Meetings & Minutes',
    events: 'Events & Attendance',
    polls: 'Polls & Decisions',
    expenses: 'Expenses & Income',
    gallery: 'Media Gallery',
    documents: 'Document Library',
    announcements: 'Announcements',
    businessFeed: 'Business Offers',
    admin: 'Admin Panel',
    portal: 'Vyapar Portal',
    
    // Actions
    search: 'Search',
    submit: 'Submit',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    viewAll: 'View All',
    quickActions: 'Quick Actions',
    back: 'Back',
    logout: 'Logout',
    login: 'Login',
    
    // Common fields
    status: 'Status',
    date: 'Date',
    category: 'Category',
    title: 'Title',
    description: 'Description',
    actions: 'Actions',
    
    // Specific terms
    welcome: 'Welcome back',
    languageToggle: 'हिन्दी',
    membershipStatus: 'Membership Status',
    active: 'Active',
    expired: 'Expired',
    pending: 'Pending',
    renewNow: 'Renew Now',
    
    // Dash widgets
    latestAnnouncements: 'Latest Announcements',
    upcomingMeetings: 'Upcoming Meetings',
    recentComplaints: 'Pending Complaints',
    activeCampaigns: 'Active Campaigns',
    recentPromotions: 'Recent Business Offers',
    noAnnouncements: 'No recent announcements',
    noMeetings: 'No upcoming meetings',
    noComplaints: 'No pending complaints',
    noCampaigns: 'No active campaigns'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    directory: 'सदस्य निर्देशिका',
    campaigns: 'अभियान व आंदोलन',
    complaints: 'शिकायत निवारण',
    meetings: 'बैठक और विवरण',
    events: 'कार्यक्रम व उपस्थिति',
    polls: 'सर्वे और मतदान',
    expenses: 'आय-व्यय बहीखाता',
    gallery: 'मीडिया गैलरी',
    documents: 'दस्तावेज लाइब्रेरी',
    announcements: 'आधिकारिक सूचनाएं',
    businessFeed: 'व्यापार ऑफर्स',
    admin: 'एडमिन पैनल',
    portal: 'व्यापार पोर्टल',
    
    // Actions
    search: 'खोजें',
    submit: 'जमा करें',
    create: 'बनाएं',
    cancel: 'रद्द करें',
    save: 'सुरक्षित करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    loading: 'लोड हो रहा है...',
    viewAll: 'सभी देखें',
    quickActions: 'त्वरित कार्रवाई',
    back: 'पीछे जाएं',
    logout: 'लॉगआउट',
    login: 'लॉगिन',
    
    // Common fields
    status: 'स्थिति',
    date: 'तारीख',
    category: 'श्रेणी',
    title: 'शीर्षक',
    description: 'विवरण',
    actions: 'कार्रवाई',
    
    // Specific terms
    welcome: 'आपका स्वागत है',
    languageToggle: 'English',
    membershipStatus: 'सदस्यता स्थिति',
    active: 'सक्रिय',
    expired: 'समाप्त',
    pending: 'लंबित',
    renewNow: 'नवीनीकरण करें',
    
    // Dash widgets
    latestAnnouncements: 'नवीनतम घोषणाएं',
    upcomingMeetings: 'आगामी बैठकें',
    recentComplaints: 'लंबित शिकायतें',
    activeCampaigns: 'सक्रिय अभियान',
    recentPromotions: 'नवीनतम व्यापार ऑफर्स',
    noAnnouncements: 'कोई नई घोषणा नहीं है',
    noMeetings: 'कोई आगामी बैठक नहीं है',
    noComplaints: 'कोई लंबित शिकायत नहीं है',
    noCampaigns: 'कोई सक्रिय अभियान नहीं है'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'] | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('vyapar_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vyapar_lang', lang);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    // Return translation if exists, otherwise the key itself
    return (dict as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
