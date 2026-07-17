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
    noCampaigns: 'No active campaigns',

    // New Landing Homepage translations
    aboutUs: 'About Our Association',
    tradersNetwork: 'Traders Network',
    resolvedGrievances: 'Resolved Grievances',
    advocacyCampaigns: 'Advocacy Campaigns',
    officialCirculars: 'Official Circulars',
    officialCircularsNotices: 'Official Circulars & Notices',
    upcomingEventsMeetings: 'Upcoming Events & Meetings',
    committeeBoard: 'Executive Committee Board',
    secretariatContacts: 'Secretariat Contacts',
    registeredTradersDirectory: 'Registered Traders Directory',
    searchShopsPlaceholder: 'Search shops by name, owner, or address...',
    officialMediaGallery: 'Official Media Gallery',
    membershipBenefits: 'Membership Benefits',
    merchantsTestimonials: 'Merchants Testimonials',
    memberPortalLogin: 'Member Portal Login',
    heroSubtitle: 'Unifying local merchants, building commercial infrastructure, and resolving grievances to accelerate trade and business.',
    directorySubtitle: 'Discover and contact verified local trade outlets, shops, and wholesale firms in Jhusi market area.',
    gallerySubtitle: 'Sneak peek into our recent trade events, assemblies, and official delegations.',
    benefitsSubtitle: 'What you unlock when you become an approved member of Jhusi Vyapar Mandal.',
    testimonialsSubtitle: 'Feedback from registered traders who resolved issues using our digital portal.',
    digitalIdCard: 'Digital Identity Card',
    digitalIdCardDesc: 'Receive a verified QR-enabled digital membership card to establish your credentials as an official trade vendor.',
    grievanceResolutions: 'Grievance Resolutions',
    grievanceResolutionsDesc: 'Raise civic drainage, electrical, security or garbage concerns directly to officers, ensuring immediate allocation to municipal offices.',
    directoryListings: 'Business Directory Listings',
    directoryListingsDesc: 'List your shop in the public directory to gain visibility amongst local consumers and network with other business houses.',
    address: 'Address',
    hotline: 'Hotline',
    supportEmail: 'Support Email',
    noActiveCirculars: 'No active circulars on the board.',
    noScheduledMeetings: 'No scheduled meetings or public trade events active.',
    noCommitteeProfiles: 'No committee profiles listed.',
    noShopsMatch: 'No registered shops match the search criteria.',
    allCategories: 'All Categories',
    ownerLabel: 'Owner',
    byAuthor: 'By:',
    about: 'About',
    mandalSecretariat: 'Mandal Secretariat',
    aboutDesc: 'We are a unified trade association dedicated to representing local businesses. We collaborate closely with civic bodies to maintain parking structures, repair commercial lanes, resolve security issues, and handle business compliance seminars.',
    testimonial1Text: '"The Vyapar Mandal helped resolve a critical parking bottleneck outside my textile showroom by coordinating with municipal authorities. The digital grievance tracking works flawlessly!"',
    testimonial1Name: 'Ramesh Kumar',
    testimonial1Sub: 'Owner, Balaji Textiles',
    testimonial2Text: '"The digital membership card was issued instantly. It makes trade coordination and official paperwork very simple. Truly a modern digital upgrade for local shops."',
    testimonial2Name: 'Vijay Sen',
    testimonial2Sub: 'Owner, Vijay Groceries',
    becomeMember: 'Become Member',
    directoryDesc: 'Browse and connect with registered trade businesses in the market.',
    searchLabel: 'Search Shop, Owner, Address or GST',
    filterCategory: 'Filter by Business Category',
    callPhone: 'Call Phone',
    whatsapp: 'WhatsApp',
    viewMap: 'View Map',
    businessDescLabel: 'Business Description',
    keyProducts: 'Key Products',
    offeredServices: 'Offered Services',
    storeGallery: 'Store & Product Gallery',
    noMembersFound: 'No registered members found matching details.',
    committeeMeetingTitle: 'Jhusi Vyapar Mandal Core Committee',
    committeeMeetingDesc: 'Official market infrastructure and compliance planning meet.',
    locationLabel: 'Jhusi, Prayagraj, Uttar Pradesh'
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
    noCampaigns: 'कोई सक्रिय अभियान नहीं है',

    // New Landing Homepage translations in Hindi
    aboutUs: 'हमारे संघ के बारे में',
    tradersNetwork: 'व्यापारी नेटवर्क',
    resolvedGrievances: 'समाधानित शिकायतें',
    advocacyCampaigns: 'सक्रिय आंदोलन',
    officialCirculars: 'आधिकारिक परिपत्र',
    officialCircularsNotices: 'आधिकारिक परिपत्र और सूचनाएं',
    upcomingEventsMeetings: 'आगामी कार्यक्रम और बैठकें',
    committeeBoard: 'कार्यकारिणी समिति बोर्ड',
    secretariatContacts: 'सचिवालय संपर्क विवरण',
    registeredTradersDirectory: 'पंजीकृत व्यापारी निर्देशिका',
    searchShopsPlaceholder: 'दुकान का नाम, मालिक या पता खोजें...',
    officialMediaGallery: 'आधिकारिक मीडिया गैलरी',
    membershipBenefits: 'सदस्यता के लाभ',
    merchantsTestimonials: 'व्यापारियों के अनुभव व समीक्षाएं',
    memberPortalLogin: 'सदस्य पोर्टल लॉगिन',
    heroSubtitle: 'स्थानीय व्यापारियों को एकजुट करना, व्यावसायिक बुनियादी ढांचे का निर्माण करना और व्यापार व व्यवसाय को गति देने के लिए शिकायतों का निवारण करना।',
    directorySubtitle: 'झूंसी बाजार क्षेत्र में सत्यापित स्थानीय व्यापार आउटलेट, दुकानों और थोक फर्मों की खोज करें और उनसे संपर्क करें।',
    gallerySubtitle: 'हमारे हालिया व्यापारिक कार्यक्रमों, सभाओं और आधिकारिक प्रतिनिधिमंडलों की एक झलक।',
    benefitsSubtitle: 'जब आप झूंसी व्यापार मंडल के स्वीकृत सदस्य बनते हैं तो आपको मिलने वाले लाभ।',
    testimonialsSubtitle: 'डिजिटल पोर्टल का उपयोग करके अपनी समस्याओं का समाधान करने वाले पंजीकृत व्यापारियों की प्रतिक्रियाएं।',
    digitalIdCard: 'डिजिटल पहचान पत्र',
    digitalIdCardDesc: 'एक आधिकारिक व्यापार विक्रेता के रूप में अपनी साख स्थापित करने के लिए एक सत्यापित क्यूआर-सक्षम डिजिटल सदस्यता कार्ड प्राप्त करें।',
    grievanceResolutions: 'शिकायतों का समाधान',
    grievanceResolutionsDesc: 'नागरिक जल निकासी, बिजली, सुरक्षा या कचरे की चिंताओं को सीधे अधिकारियों के समक्ष उठाएं, नगर निगम कार्यालयों को त्वरित आवंटन सुनिश्चित करें।',
    directoryListings: 'व्यापार निर्देशिका लिस्टिंग',
    directoryListingsDesc: 'स्थानीय उपभोक्ताओं के बीच दृश्यता प्राप्त करने और अन्य व्यावसायिक घरानों के साथ नेटवर्क बनाने के लिए सार्वजनिक निर्देशिका में अपनी दुकान को सूचीबद्ध करें।',
    address: 'पता',
    hotline: 'हॉटलाइन',
    supportEmail: 'सहायता ईमेल',
    noActiveCirculars: 'सूचना बोर्ड पर कोई सक्रिय परिपत्र नहीं है।',
    noScheduledMeetings: 'कोई निर्धारित बैठक या सार्वजनिक व्यापार कार्यक्रम सक्रिय नहीं है।',
    noCommitteeProfiles: 'कोई कार्यकारिणी सदस्य सूचीबद्ध नहीं है।',
    noShopsMatch: 'खोज मानदंडों से मेल खाती कोई पंजीकृत दुकान नहीं मिली।',
    allCategories: 'सभी श्रेणियां',
    ownerLabel: 'मालिक',
    byAuthor: 'द्वारा:',
    about: 'हमारे बारे में',
    mandalSecretariat: 'मंडल सचिवालय',
    aboutDesc: 'हम स्थानीय व्यवसायों का प्रतिनिधित्व करने के लिए समर्पित एक एकीकृत व्यापार संघ हैं। हम पार्किंग स्थलों के रख-रखाव, व्यावसायिक गलियों की मरम्मत, सुरक्षा मुद्दों को हल करने और व्यापार अनुपालन सेमिनारों का आयोजन करने के लिए नागरिक निकायों के साथ मिलकर काम करते हैं।',
    testimonial1Text: '"व्यापार मंडल ने नगर निगम अधिकारियों के साथ समन्वय करके मेरे कपड़ा शोरूम के बाहर पार्किंग की गंभीर समस्या को हल करने में मदद की। डिजिटल शिकायत ट्रैकिंग पूरी तरह से काम करती है!"',
    testimonial1Name: 'रमेश कुमार',
    testimonial1Sub: 'मालिक, बालाजी टेक्सटाइल्स',
    testimonial2Text: '"डिजिटल सदस्यता कार्ड तुरंत जारी किया गया था। यह व्यापार समन्वय और आधिकारिक कागजी कार्रवाई को बहुत सरल बनाता है। वास्तव में स्थानीय दुकानों के लिए एक आधुनिक डिजिटल अपग्रेड है।"',
    testimonial2Name: 'विजय सेन',
    testimonial2Sub: 'मालिक, विजय किराना',
    becomeMember: 'सदस्य बनें',
    directoryDesc: 'बाजार में पंजीकृत व्यापार व्यवसायों को खोजें और उनसे संपर्क करें।',
    searchLabel: 'दुकान, मालिक, पता या जीएसटी खोजें',
    filterCategory: 'व्यवसाय श्रेणी द्वारा फ़िल्टर करें',
    callPhone: 'फ़ोन कॉल',
    whatsapp: 'व्हाट्सएप',
    viewMap: 'मानचित्र देखें',
    businessDescLabel: 'व्यवसाय विवरण',
    keyProducts: 'प्रमुख उत्पाद',
    offeredServices: 'प्रदान की जाने वाली सेवाएं',
    storeGallery: 'दुकान और उत्पाद गैलरी',
    noMembersFound: 'कोई पंजीकृत सदस्य विवरण से मेल खाता नहीं मिला।',
    committeeMeetingTitle: 'झूंसी व्यापार मंडल कोर कमेटी',
    committeeMeetingDesc: 'आधिकारिक बाजार बुनियादी ढांचा और अनुपालन बैठक।',
    locationLabel: 'झूंसी, प्रयागराज, उत्तर प्रदेश'
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
