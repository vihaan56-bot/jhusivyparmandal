// dataService.ts - Manages Firestore collections or transparently falls back to localStorage simulation
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;
let db: any = null;
let functions: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    functions = getFunctions(app);
  } catch (error) {
    console.error('Firebase Firestore initialization failed:', error);
  }
}

// -----------------------------------------------------------------------------
// SEED DATA FOR LOCAL STORAGE SIMULATION
// -----------------------------------------------------------------------------
const INITIAL_ASSOCIATIONS = [
  {
    id: 'jhusi-prayagraj',
    name: 'Jhusi Vyapar Mandal, Prayagraj',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&w=150&h=150&q=80',
    primaryColor: '#1e3a8a', // Deep Blue
    secondaryColor: '#d97706', // Golden
    contactEmail: 'contact@jhusivyaparmandal.org',
    contactPhone: '+91 94152 16180',
    address: 'Main Bazaar Road, Jhusi, Prayagraj, Uttar Pradesh - 211019',
    active: true,
    createdAt: '2025-01-15T00:00:00Z'
  }
];

const INITIAL_USERS = [
  {
    uid: 'user_super_admin',
    email: 'admin@vyapar.org',
    displayName: 'Rajesh Sharma',
    phoneNumber: '+91 99999 88888',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh'
  },
  {
    uid: 'user_president',
    email: 'president@vyapar.org',
    displayName: 'Mohan Lal Girdhar',
    phoneNumber: '+91 98765 43210',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan'
  },
  {
    uid: 'user_secretary',
    email: 'secretary@vyapar.org',
    displayName: 'Sunil Gupta',
    phoneNumber: '+91 98888 77777',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunil'
  },
  {
    uid: 'user_treasurer',
    email: 'treasurer@vyapar.org',
    displayName: 'Alok Verma',
    phoneNumber: '+91 96666 55555',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alok'
  },
  {
    uid: 'user_member_vijay',
    email: 'member@vyapar.org',
    displayName: 'Vijay Kumar (Vijay Kirana Store)',
    phoneNumber: '+91 95555 44444',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay'
  }
];

const INITIAL_MEMBERSHIPS = [
  // Jhusi Memberships
  {
    id: 'jhusi-prayagraj_user_super_admin',
    associationId: 'jhusi-prayagraj',
    userId: 'user_super_admin',
    role: 'super_admin',
    status: 'active',
    shopName: 'Vyapar Association Head Office',
    category: 'Administration',
    ownerName: 'Rajesh Sharma',
    phone: '+91 99999 88888',
    email: 'admin@vyapar.org',
    address: 'Shop 42, Block C, Jhusi, Prayagraj',
    businessDescription: 'Main administrative council for Jhusi',
    businessImages: [],
    products: [],
    services: [],
    membershipExpiry: '2030-12-31',
    membershipCardNumber: 'SB-2026-0001',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'jhusi-prayagraj_user_president',
    associationId: 'jhusi-prayagraj',
    userId: 'user_president',
    role: 'president',
    status: 'active',
    shopName: 'Girdhar Handloom Emporium',
    category: 'Textiles & Handlooms',
    ownerName: 'Mohan Lal Girdhar',
    phone: '+91 98765 43210',
    email: 'president@vyapar.org',
    address: 'Shop 104, Handloom Market, Jhusi, Prayagraj',
    googleMapsLink: 'https://maps.google.com',
    gstNumber: '07AAAAA1111A1Z1',
    businessDescription: 'Premier handloom products, bedsheets, blankets and home furnishings at wholesale rates.',
    businessImages: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abad?auto=format&fit=crop&w=400&q=80'
    ],
    products: ['Bedsheets', 'Handloom Blankets', 'Curtains', 'Sofa Covers'],
    services: ['Wholesale Distribution', 'Custom Stitching'],
    membershipExpiry: '2027-06-30',
    membershipCardNumber: 'SB-2026-0002',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'jhusi-prayagraj_user_secretary',
    associationId: 'jhusi-prayagraj',
    userId: 'user_secretary',
    role: 'secretary',
    status: 'active',
    shopName: 'Gupta Plastic & General Store',
    category: 'Plastics & Household Goods',
    ownerName: 'Sunil Gupta',
    phone: '+91 98888 77777',
    email: 'secretary@vyapar.org',
    address: 'Shop 15, Bara Tooti Chowk, Jhusi, Prayagraj',
    googleMapsLink: 'https://maps.google.com',
    gstNumber: '07BBBBB2222B2Z2',
    businessDescription: 'Leading manufacturers and wholesalers of kitchenware, domestic plastics, storage boxes, and children toys.',
    businessImages: [
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80'
    ],
    products: ['Plastic Chairs', 'Kitchen Organizers', 'Plastic Toys', 'Tiffin Boxes'],
    services: ['Bulk Corporate Gifting', 'Pan-India Shipping'],
    membershipExpiry: '2027-06-30',
    membershipCardNumber: 'SB-2026-0003',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'jhusi-prayagraj_user_treasurer',
    associationId: 'jhusi-prayagraj',
    userId: 'user_treasurer',
    role: 'treasurer',
    status: 'active',
    shopName: 'Verma Jewellers',
    category: 'Jewellery & Ornaments',
    ownerName: 'Alok Verma',
    phone: '+91 96666 55555',
    email: 'treasurer@vyapar.org',
    address: 'Shop 88, Main Bazaar, Jhusi, Prayagraj',
    googleMapsLink: 'https://maps.google.com',
    gstNumber: '07CCCCC3333C3Z3',
    businessDescription: 'Wholesale and retail merchants of pure silver utensils, traditional gold ornaments, and certified diamonds.',
    businessImages: [],
    products: ['Silver Coins', 'Gold Necklaces', 'Diamond Rings'],
    services: ['Jewellery Polishing', 'Purity Testing'],
    membershipExpiry: '2027-06-30',
    membershipCardNumber: 'SB-2026-0004',
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'jhusi-prayagraj_user_member_vijay',
    associationId: 'jhusi-prayagraj',
    userId: 'user_member_vijay',
    role: 'business_member',
    status: 'active',
    shopName: 'Vijay Kirana Store',
    category: 'Groceries & Kirana',
    ownerName: 'Vijay Kumar',
    phone: '+91 95555 44444',
    email: 'member@vyapar.org',
    address: 'Shop 5, Gali Qutubuddin, Jhusi, Prayagraj',
    googleMapsLink: 'https://maps.google.com',
    gstNumber: '07DDDDD4444D4Z4',
    businessDescription: 'Daily essentials, spices, dry fruits, lentils, and premium grain varieties at market beating wholesale rates.',
    businessImages: [],
    products: ['Basmati Rice', 'Pure Spices', 'Almonds & Cashews', 'Organic Pulses'],
    services: ['Free Home Delivery in Sadar area'],
    membershipExpiry: '2026-10-15',
    membershipCardNumber: 'SB-2026-0058',
    createdAt: '2025-02-01T00:00:00Z'
  },
  // Lamington Road Memberships (President is also Mohan Lal Girdhar for testing multi-tenancy)
  {
    id: 'jhusi-prayagraj_user_president',
    associationId: 'jhusi-prayagraj',
    userId: 'user_president',
    role: 'president',
    status: 'active',
    shopName: 'Girdhar Electronics & Spares',
    category: 'Electronics & Hardware',
    ownerName: 'Mohan Lal Girdhar',
    phone: '+91 98765 43210',
    email: 'president@vyapar.org',
    address: 'Shop B-12, Electronic Plaza, Lamington Road, Prayagraj',
    googleMapsLink: 'https://maps.google.com',
    businessDescription: 'Wholesalers of microcontrollers, ICs, SMD components, test equipment and custom PCB design solutions.',
    businessImages: [],
    products: ['Arduino Boards', 'Multimeters', 'Soldering Stations', 'Resistors & Capacitors'],
    services: ['PCB Manufacturing support'],
    membershipExpiry: '2028-01-01',
    membershipCardNumber: 'LR-2026-0001',
    createdAt: '2025-02-10T00:00:00Z'
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann_gst_deadline',
    associationId: 'jhusi-prayagraj',
    title: 'âš ï¸ GST Filing Extension Notice & Compliance Workshop',
    content: 'Dear members, the Ministry of Finance has extended the GSTR-1 & GSTR-3B filing deadlines for quarterly filers. In response, Jhusi Vyapar Mandal is organizing a free workshop with Senior Chartered Accountants this Saturday at 4 PM in the main office. Bring your laptops and files for hands-on grievance support.',
    attachments: [
      { name: 'Govt_Circular_GST_Extension.pdf', url: '#', type: 'application/pdf' }
    ],
    priority: 'high',
    pinned: true,
    pushNotification: true,
    status: 'published',
    authorId: 'user_secretary',
    authorName: 'Sunil Gupta',
    authorRole: 'Secretary',
    createdAt: '2026-07-15T10:00:00Z'
  },
  {
    id: 'ann_security_cameras',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ“¸ Install CCTV Facing Outside Shops (Police Advisory)',
    content: 'As per recommendations from the Prayagraj Police Traffic and Security Wing, all shops in Gali Qutubuddin and Bara Tooti Chowk are requested to install at least one high-definition security camera facing the public passage. This will help reduce petty thefts and coordinate with our newly appointed night watchmen.',
    attachments: [],
    priority: 'medium',
    pinned: false,
    pushNotification: false,
    status: 'published',
    authorId: 'user_president',
    authorName: 'Mohan Lal Girdhar',
    authorRole: 'President',
    createdAt: '2026-07-12T08:30:00Z'
  }
];

const INITIAL_CAMPAIGNS = [
  {
    id: 'camp_road_sewer',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ”§ Jhusi Gali Expansion & Sewer Reconstruction',
    description: 'A concerted effort by the association to address the 20-year-old clogging issue in the main commercial lanes. Water accumulation during monsoons damages lakhs worth of fabrics and cardboard boxes. We are lobbying the MCD (Municipal Corporation of Prayagraj) to replace the ancient pipeline and widen the primary lane.',
    timeline: [
      { date: '2026-03-10', title: 'Memorandum Submitted', description: 'Met with Deputy Commissioner of MCD and handed over a signature petition signed by 240 shop owners.' },
      { date: '2026-05-15', title: 'Survey Approved', description: 'Govt engineers visited Jhusi to perform mapping of underground pipes.' },
      { date: '2026-07-01', title: 'Budget Allocation', description: 'MCD sanctioned â‚¹45 Lakhs under urban development fund. Project put to tender.' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
    ],
    videos: [],
    govLetters: [
      { title: 'MCD_Sanction_Order_No_440.pdf', url: '#', date: '2026-07-02' },
      { title: 'Petition_Signatures_Scanned.pdf', url: '#', date: '2026-03-09' }
    ],
    documents: [],
    participantsCount: 242,
    mediaCoverage: [
      { title: 'Dainik Jagran: Jhusi Market Sewer Blockage Demands Action', url: '#', source: 'Dainik Jagran' },
      { title: 'Navbharat Times: â‚¹45 Lakhs Approved for Sadar Lanes', url: '#', source: 'Navbharat Times' }
    ],
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z'
  }
];

const INITIAL_COMPLAINTS = [
  {
    id: 'comp_garbage_dump',
    associationId: 'jhusi-prayagraj',
    userId: 'user_member_vijay',
    userName: 'Vijay Kumar',
    category: 'garbage',
    title: 'Unchecked Garbage Dump Pileup near Gali Qutubuddin Gate',
    description: 'MCD garbage collector trucks have skipped the collection point for 3 consecutive days. The piles of rotten organic food and plastic are obstructing the entrance path of customers and creating a severe stench. Customers are avoiding our street entirely.',
    status: 'assigned',
    photos: [
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80'
    ],
    location: { addressString: 'Near Gate Gali Qutubuddin, Jhusi' },
    assignedToId: 'user_secretary',
    assignedToName: 'Sunil Gupta (Secretary)',
    comments: [
      {
        id: 'comm_1',
        userId: 'user_secretary',
        userName: 'Sunil Gupta',
        userRole: 'Secretary',
        text: 'I have contacted the Ward Sanitation Inspector. He has promised to deploy a heavy dumper by tomorrow morning. I will personally visit the spot.',
        createdAt: '2026-07-16T11:00:00Z'
      }
    ],
    createdAt: '2026-07-15T14:20:00Z'
  }
];

const INITIAL_MEETINGS = [
  {
    id: 'meet_monthly_exec',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ“… Monthly Executive Committee Meeting (July 2026)',
    dateTime: '2026-07-20T17:00:00',
    agenda: [
      'Night Watchman budget approval & recruitment process',
      'Update on sewer line reconstruction and MCD coordination',
      'Arrangements for the upcoming Independence Day Flag Hoisting',
      'Member complaints regarding street vendors clogging footpaths'
    ],
    venue: 'Association Head Office, Girdhar Emporium building 2nd floor',
    isVirtual: false,
    attendance: [
      { userId: 'user_president', userName: 'Mohan Lal Girdhar', present: true, role: 'President' },
      { userId: 'user_secretary', userName: 'Sunil Gupta', present: true, role: 'Secretary' },
      { userId: 'user_treasurer', userName: 'Alok Verma', present: true, role: 'Treasurer' }
    ],
    minutes: 'The committee met to align on night safety. Agreed to hire 3 private night watchmen at â‚¹12,000/month each. Treasurer Alok Verma to allocate funds from membership dues. Action item assigned to Sunil to verify watchmen references. MCD sewer project has been put to bid; we expect digging to start by mid-August.',
    actionItems: [
      { task: 'Draft watchman job descriptions and verify references', assignee: 'Sunil Gupta', dueDate: '2026-07-25', completed: false },
      { task: 'Allocate â‚¹36,000 watchman safety budget', assignee: 'Alok Verma', dueDate: '2026-07-24', completed: true }
    ],
    attachments: [],
    aiSummary: 'Main discussions centered on hiring 3 security watchmen at â‚¹12,000/month. Tenders for sewer rebuilding will close by August. The association will coordinate a flag hoisting for Independence Day. Next review scheduled on July 20th.',
    createdAt: '2026-07-10T12:00:00Z'
  }
];

const INITIAL_EVENTS = [
  {
    id: 'evt_gst_seminar',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ§¾ GST compliance workshop & e-Invoicing Seminar',
    description: 'Detailed training session focused on newly mandated e-Invoicing regulations for B2B merchants. Guest Lecture by CA Ramesh Aggarwal. Tea & Snacks will be served.',
    type: 'training',
    dateTime: '2026-07-18T16:00:00',
    venue: 'Association Hall (Behind Main Bazaar Police Booth)',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'
    ],
    registrations: [
      { userId: 'user_member_vijay', userName: 'Vijay Kumar', registeredAt: '2026-07-15T15:00:00Z', checkedIn: false }
    ],
    createdAt: '2026-07-12T00:00:00Z'
  }
];

const INITIAL_POLLS = [
  {
    id: 'poll_sunday_close',
    associationId: 'jhusi-prayagraj',
    question: 'Should we request the government to declare Sunday as a mandatory complete holiday for all Jhusi shops?',
    options: [
      { id: 'opt_yes', text: 'Yes, full closure is needed for rest and maintenance', votesCount: 54 },
      { id: 'opt_no', text: 'No, Sunday is the peak day for family buyers', votesCount: 38 },
      { id: 'opt_half', text: 'Half day only (Open till 1 PM)', votesCount: 12 }
    ],
    type: 'decision',
    anonymous: true,
    expiresAt: '2026-07-25T18:00:00Z',
    status: 'active',
    createdBy: 'user_president',
    createdAt: '2026-07-14T09:00:00Z'
  }
];

const INITIAL_EXPENSES = [
  {
    id: 'exp_1',
    associationId: 'jhusi-prayagraj',
    type: 'income',
    category: 'Membership Dues',
    amount: 120000,
    description: 'Quarterly membership subscription collection (Jan - Mar 2026)',
    date: '2026-04-10',
    recordedBy: 'Alok Verma (Treasurer)',
    createdAt: '2026-04-10T11:00:00Z'
  },
  {
    id: 'exp_2',
    associationId: 'jhusi-prayagraj',
    type: 'expense',
    category: 'Legal & Advocacy',
    amount: 15000,
    description: 'Advocate fee for drafting MCD sewer PIL petition',
    date: '2026-05-02',
    recordedBy: 'Alok Verma (Treasurer)',
    createdAt: '2026-05-02T14:30:00Z'
  },
  {
    id: 'exp_3',
    associationId: 'jhusi-prayagraj',
    type: 'expense',
    category: 'Events & Catering',
    amount: 8500,
    description: 'Refreshments & tea for GST Compliance Workshop',
    date: '2026-07-15',
    recordedBy: 'Alok Verma (Treasurer)',
    createdAt: '2026-07-15T18:30:00Z'
  }
];

const INITIAL_BUSINESS_POSTS = [
  {
    id: 'post_monsoon_sale',
    associationId: 'jhusi-prayagraj',
    userId: 'user_president',
    type: 'festival_sale',
    title: 'ðŸŒ§ï¸ Monsoon Handloom Clearance - Flat 35% Off Wholesale',
    description: 'Bulk clearance sale on heavy cotton bedsheets and winter handloom blankets at Girdhar Handloom. Special discounts for registered Jhusi Vyapar Mandal members. Min order quantity: 50 sets.',
    shopName: 'Girdhar Handloom Emporium',
    contactPhone: '+91 98765 43210',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80'
    ],
    expiresAt: '2026-08-16T00:00:00Z',
    createdAt: '2026-07-14T09:00:00Z'
  },
  {
    id: 'post_delivery_boy',
    associationId: 'jhusi-prayagraj',
    userId: 'user_member_vijay',
    type: 'hiring',
    title: 'ðŸ“¦ Hiring Delivery Boy / Loader (Immediate Join)',
    description: 'Vijay Kirana Store needs a young, dynamic boy for loading grains and driving delivery rickshaws around Sadar market. Must know routes of Chandni Chowk and Bara Tooti. Salary: â‚¹14,000/month + lunch.',
    shopName: 'Vijay Kirana Store',
    contactPhone: '+91 95555 44444',
    images: [],
    expiresAt: '2026-07-30T00:00:00Z',
    createdAt: '2026-07-16T12:00:00Z'
  }
];

const INITIAL_DOCUMENTS = [
  {
    id: 'doc_const',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ“œ Vyapar Mandal Constitution and Code of Conduct',
    category: 'constitution',
    fileUrl: '#',
    fileSize: '1.2 MB',
    fileType: 'pdf',
    version: '1.4',
    downloadCount: 145,
    createdAt: '2025-01-20T00:00:00Z'
  },
  {
    id: 'doc_memb_form',
    associationId: 'jhusi-prayagraj',
    title: 'ðŸ“„ Offline Membership Application & Renewal Form',
    category: 'membership_form',
    fileUrl: '#',
    fileSize: '450 KB',
    fileType: 'pdf',
    version: '2.0',
    downloadCount: 312,
    createdAt: '2025-01-20T00:00:00Z'
  }
];

const INITIAL_GALLERY = [
  {
    id: 'gal_pil_sub',
    associationId: 'jhusi-prayagraj',
    albumName: 'Advocacy',
    type: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    description: 'Submitting sewer line proposal to Municipal Commissioner',
    createdAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'gal_press_clip',
    associationId: 'jhusi-prayagraj',
    albumName: 'Press Clippings',
    type: 'newspaper',
    mediaUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    description: 'Hindustan Times cover on Sadar market drainage issues',
    createdAt: '2026-05-18T10:00:00Z'
  }
];

// Initialize Mock DB in localStorage if empty
function initializeMockDB() {
  const getOrSet = (key: string, data: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };
  getOrSet('vyapar_associations', INITIAL_ASSOCIATIONS);
  getOrSet('vyapar_users', INITIAL_USERS);
  getOrSet('vyapar_memberships', INITIAL_MEMBERSHIPS);
  getOrSet('vyapar_announcements', INITIAL_ANNOUNCEMENTS);
  getOrSet('vyapar_campaigns', INITIAL_CAMPAIGNS);
  getOrSet('vyapar_complaints', INITIAL_COMPLAINTS);
  getOrSet('vyapar_meetings', INITIAL_MEETINGS);
  getOrSet('vyapar_events', INITIAL_EVENTS);
  getOrSet('vyapar_polls', INITIAL_POLLS);
  getOrSet('vyapar_expenses', INITIAL_EXPENSES);
  getOrSet('vyapar_business_posts', INITIAL_BUSINESS_POSTS);
  getOrSet('vyapar_documents', INITIAL_DOCUMENTS);
  getOrSet('vyapar_gallery', INITIAL_GALLERY);
  getOrSet('vyapar_votes', []);
  getOrSet('vyapar_notifications', [
    {
      id: 'notif_1',
      associationId: 'jhusi-prayagraj',
      recipientId: 'user_president',
      title: 'ðŸš¨ New Complaint Lodged',
      body: 'Vijay Kumar raised a complaint regarding Garbage Dump pileup.',
      read: false,
      link: '/complaints',
      type: 'complaint',
      createdAt: new Date().toISOString()
    }
  ]);
  getOrSet('vyapar_audit_logs', []);
}

initializeMockDB();

// Helper to interact with LocalStorage
const mockStore = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data))
};

// -----------------------------------------------------------------------------
// CENTRAL DATA SERVICE ROUTER
// -----------------------------------------------------------------------------
export const dataService = {
  // General Association / Tenant APIS
  getAssociations: async (): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, 'associations'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_associations');
    }
  },

  getAssociation: async (id: string): Promise<any | null> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'associations', id);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } else {
      const list = mockStore.get('vyapar_associations');
      return list.find((a: any) => a.id === id) || null;
    }
  },

  createAssociation: async (association: any): Promise<any> => {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'associations', association.id), association);
      return association;
    } else {
      const list = mockStore.get('vyapar_associations');
      list.push(association);
      mockStore.set('vyapar_associations', list);
      return association;
    }
  },

  deleteAssociation: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'associations', id));
    } else {
      const list = mockStore.get('vyapar_associations');
      const filtered = list.filter((a: any) => a.id !== id);
      mockStore.set('vyapar_associations', filtered);
    }
  },

  // User Profile APIS
  getUserProfile: async (uid: string): Promise<any | null> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } else {
      const list = mockStore.get('vyapar_users');
      return list.find((u: any) => u.uid === uid) || null;
    }
  },

  createUserProfile: async (profile: any): Promise<any> => {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', profile.uid), profile);
      return profile;
    } else {
      const list = mockStore.get('vyapar_users');
      list.push(profile);
      mockStore.set('vyapar_users', list);
      return profile;
    }
  },

  getAdminUsers: async (): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } else {
      const list = mockStore.get('vyapar_users') || [];
      return list.filter((u: any) => u.role === 'admin');
    }
  },

  createAdminUser: async (adminData: any): Promise<any> => {
    if (isFirebaseConfigured && db) {
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { deleteApp } = await import('firebase/app');
      
      const tempAppName = `tempAdminApp_${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      try {
        const userCred = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
        const uid = userCred.user.uid;
        
        const userProfile = {
          uid,
          email: adminData.email,
          displayName: adminData.displayName,
          phoneNumber: adminData.phoneNumber || '',
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminData.displayName)}`,
          role: 'admin',
          needsPasswordChange: true,
          disabled: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), userProfile);
        
        await signOut(tempAuth);
        await deleteApp(tempApp);
        
        return { success: true, uid };
      } catch (err: any) {
        try {
          await deleteApp(tempApp);
        } catch (_) {}
        throw err;
      }
    } else {
      const list = mockStore.get('vyapar_users') || [];
      const newAdmin = {
        uid: `admin_${Math.floor(100000 + Math.random() * 900000)}`,
        email: adminData.email,
        displayName: adminData.displayName,
        phoneNumber: adminData.phoneNumber || '',
        role: 'admin',
        needsPasswordChange: true,
        disabled: false,
        createdAt: new Date().toISOString()
      };
      list.push(newAdmin);
      mockStore.set('vyapar_users', list);
      return { success: true, uid: newAdmin.uid };
    }
  },

  deleteAdminUser: async (uid: string): Promise<any> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'users', uid));
      return { success: true };
    } else {
      const list = mockStore.get('vyapar_users') || [];
      const filtered = list.filter((u: any) => u.uid !== uid);
      mockStore.set('vyapar_users', filtered);
      return { success: true };
    }
  },

  toggleAdminUserStatus: async (uid: string, disabled: boolean): Promise<any> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', uid), { disabled });
      return { success: true };
    } else {
      const list = mockStore.get('vyapar_users') || [];
      const idx = list.findIndex((u: any) => u.uid === uid);
      if (idx !== -1) {
        list[idx] = { ...list[idx], disabled };
        mockStore.set('vyapar_users', list);
      }
      return { success: true };
    }
  },

  resetAdminUserPassword: async (uid: string, newPassword?: string, email?: string): Promise<any> => {
    if (isFirebaseConfigured && db) {
      const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
      const authInstance = getAuth();
      
      let targetEmail = email;
      if (!targetEmail) {
        const docSnap = await getDoc(doc(db, 'users', uid));
        targetEmail = docSnap.data()?.email;
      }
      
      if (targetEmail) {
        await sendPasswordResetEmail(authInstance, targetEmail);
      }
      
      await updateDoc(doc(db, 'users', uid), { needsPasswordChange: true });
      return { success: true };
    } else {
      const list = mockStore.get('vyapar_users') || [];
      const idx = list.findIndex((u: any) => u.uid === uid);
      if (idx !== -1) {
        list[idx] = { ...list[idx], needsPasswordChange: true };
        mockStore.set('vyapar_users', list);
      }
      return { success: true };
    }
  },

  // Membership Management
  getUserMembership: async (associationId: string, userId: string): Promise<any | null> => {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'memberships'), 
        where('associationId', '==', associationId),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
    } else {
      const list = mockStore.get('vyapar_memberships');
      return list.find((m: any) => m.associationId === associationId && m.userId === userId) || null;
    }
  },

  getMemberships: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'memberships'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const list = mockStore.get('vyapar_memberships');
      return list.filter((m: any) => m.associationId === associationId);
    }
  },

  createOrUpdateMembership: async (membership: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'memberships', membership.id), membership);
    } else {
      const list = mockStore.get('vyapar_memberships');
      const idx = list.findIndex((m: any) => m.id === membership.id);
      if (idx !== -1) {
        list[idx] = membership;
      } else {
        list.push(membership);
      }
      mockStore.set('vyapar_memberships', list);
    }
  },

  updateSimulatedRole: async (associationId: string, userId: string, role: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      // Find and update role in DB
      const id = `${associationId}_${userId}`;
      await updateDoc(doc(db, 'memberships', id), { role });
    } else {
      const list = mockStore.get('vyapar_memberships');
      const id = `${associationId}_${userId}`;
      const idx = list.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        list[idx].role = role;
        list[idx].status = 'active'; // ensure they're active when switching
      } else {
        // Create a default membership profile
        const user = mockStore.get('vyapar_users').find((u: any) => u.uid === userId);
        const newMemb = {
          id,
          associationId,
          userId,
          role,
          status: 'active',
          shopName: 'Demo Shop Center',
          category: 'General Merchandising',
          ownerName: user?.displayName || 'Merchant Owner',
          phone: user?.phoneNumber || '+91 99999 99999',
          email: user?.email || 'shop@vyapar.org',
          address: 'Main Chowk Market Area',
          businessDescription: 'Wholesale and retail services.',
          businessImages: [],
          products: [],
          services: [],
          membershipExpiry: '2028-12-31',
          membershipCardNumber: `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString()
        };
        list.push(newMemb);
      }
      mockStore.set('vyapar_memberships', list);
    }
  },

  // -----------------------------------------------------------------------------
  // CRUD COLLECTION APIS
  // -----------------------------------------------------------------------------
  
  // 1. Announcements
  getAnnouncements: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'announcements'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_announcements').filter((a: any) => a.associationId === associationId);
    }
  },

  createAnnouncement: async (ann: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'announcements'), ann);
    } else {
      const list = mockStore.get('vyapar_announcements');
      list.unshift({ id: `ann_${Date.now()}`, ...ann });
      mockStore.set('vyapar_announcements', list);
    }
  },

  updateAnnouncement: async (id: string, ann: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'announcements', id), ann);
    } else {
      const list = mockStore.get('vyapar_announcements');
      const idx = list.findIndex((a: any) => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...ann };
        mockStore.set('vyapar_announcements', list);
      }
    }
  },

  // 2. Business classified posts
  getBusinessPosts: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'business_posts'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_business_posts').filter((p: any) => p.associationId === associationId);
    }
  },

  createBusinessPost: async (post: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'business_posts'), post);
    } else {
      const list = mockStore.get('vyapar_business_posts');
      list.unshift({ id: `post_${Date.now()}`, ...post });
      mockStore.set('vyapar_business_posts', list);
    }
  },

  // 3. Campaigns
  getCampaigns: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'campaigns'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_campaigns').filter((c: any) => c.associationId === associationId);
    }
  },

  createCampaign: async (camp: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'campaigns'), camp);
    } else {
      const list = mockStore.get('vyapar_campaigns');
      list.unshift({ id: `camp_${Date.now()}`, ...camp });
      mockStore.set('vyapar_campaigns', list);
    }
  },

  updateCampaign: async (id: string, camp: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'campaigns', id), camp);
    } else {
      const list = mockStore.get('vyapar_campaigns');
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...camp };
        mockStore.set('vyapar_campaigns', list);
      }
    }
  },

  // 4. Complaints
  getComplaints: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'complaints'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_complaints').filter((c: any) => c.associationId === associationId);
    }
  },

  createComplaint: async (comp: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'complaints'), comp);
    } else {
      const list = mockStore.get('vyapar_complaints');
      list.unshift({ id: `comp_${Date.now()}`, ...comp });
      mockStore.set('vyapar_complaints', list);
      
      // Dispatch notification to president
      const notifs = mockStore.get('vyapar_notifications');
      notifs.unshift({
        id: `notif_${Date.now()}`,
        associationId: comp.associationId,
        recipientId: 'user_president',
        title: 'ðŸš¨ New Complaint Raised',
        body: `${comp.userName} raised an issue: ${comp.title}`,
        read: false,
        link: '/complaints',
        type: 'complaint',
        createdAt: new Date().toISOString()
      });
      mockStore.set('vyapar_notifications', notifs);
    }
  },

  updateComplaint: async (id: string, comp: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'complaints', id), comp);
    } else {
      const list = mockStore.get('vyapar_complaints');
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...comp };
        mockStore.set('vyapar_complaints', list);

        // Dispatch notifications if status updated
        if (comp.status) {
          const notifs = mockStore.get('vyapar_notifications');
          notifs.unshift({
            id: `notif_${Date.now()}`,
            associationId: list[idx].associationId,
            recipientId: list[idx].userId,
            title: `ðŸ”„ Complaint Status Updated: ${comp.status.toUpperCase()}`,
            body: `Your complaint regarding "${list[idx].title}" is now ${comp.status}.`,
            read: false,
            link: '/complaints',
            type: 'complaint',
            createdAt: new Date().toISOString()
          });
          mockStore.set('vyapar_notifications', notifs);
        }
      }
    }
  },

  // 5. Meetings
  getMeetings: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'meetings'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_meetings').filter((m: any) => m.associationId === associationId);
    }
  },

  createMeeting: async (meet: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'meetings'), meet);
    } else {
      const list = mockStore.get('vyapar_meetings');
      list.unshift({ id: `meet_${Date.now()}`, ...meet });
      mockStore.set('vyapar_meetings', list);
    }
  },

  updateMeeting: async (id: string, meet: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'meetings', id), meet);
    } else {
      const list = mockStore.get('vyapar_meetings');
      const idx = list.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...meet };
        mockStore.set('vyapar_meetings', list);
      }
    }
  },

  // 6. Events
  getEvents: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'events'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_events').filter((e: any) => e.associationId === associationId);
    }
  },

  createEvent: async (evt: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'events'), evt);
    } else {
      const list = mockStore.get('vyapar_events');
      list.unshift({ id: `evt_${Date.now()}`, ...evt });
      mockStore.set('vyapar_events', list);
    }
  },

  registerForEvent: async (eventId: string, userId: string, userName: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      // In Firebase we update the event registration list
      const docRef = doc(db, 'events', eventId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const registrations = data.registrations || [];
        if (!registrations.some((r: any) => r.userId === userId)) {
          registrations.push({ userId, userName, registeredAt: new Date().toISOString(), checkedIn: false });
          await updateDoc(docRef, { registrations });
        }
      }
    } else {
      const list = mockStore.get('vyapar_events');
      const idx = list.findIndex((e: any) => e.id === eventId);
      if (idx !== -1) {
        const registrations = list[idx].registrations || [];
        if (!registrations.some((r: any) => r.userId === userId)) {
          registrations.push({ userId, userName, registeredAt: new Date().toISOString(), checkedIn: false });
          list[idx].registrations = registrations;
          mockStore.set('vyapar_events', list);
        }
      }
    }
  },

  checkInEventQR: async (eventId: string, userId: string): Promise<boolean> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'events', eventId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const registrations = data.registrations || [];
        const reg = registrations.find((r: any) => r.userId === userId);
        if (reg) {
          reg.checkedIn = true;
          reg.checkInTime = new Date().toISOString();
          await updateDoc(docRef, { registrations });
          return true;
        }
      }
      return false;
    } else {
      const list = mockStore.get('vyapar_events');
      const idx = list.findIndex((e: any) => e.id === eventId);
      if (idx !== -1) {
        const registrations = list[idx].registrations || [];
        const reg = registrations.find((r: any) => r.userId === userId);
        if (reg) {
          reg.checkedIn = true;
          reg.checkInTime = new Date().toISOString();
          mockStore.set('vyapar_events', list);
          return true;
        }
      }
      return false;
    }
  },

  // 7. Polls & Voting
  getPolls: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'polls'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_polls').filter((p: any) => p.associationId === associationId);
    }
  },

  createPoll: async (poll: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'polls'), poll);
    } else {
      const list = mockStore.get('vyapar_polls');
      list.unshift({ id: `poll_${Date.now()}`, ...poll });
      mockStore.set('vyapar_polls', list);
    }
  },

  voteInPoll: async (pollId: string, optionId: string, userId: string): Promise<boolean> => {
    if (isFirebaseConfigured && db) {
      // In real DB we save a vote doc to prevent duplicate voting, and increment option votes
      const voteId = `${pollId}_${userId}`;
      const voteRef = doc(db, 'votes', voteId);
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) return false; // already voted
      
      await setDoc(voteRef, { pollId, optionId, userId, votedAt: new Date().toISOString() });
      
      // Update poll option count
      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await getDoc(pollRef);
      if (pollSnap.exists()) {
        const poll = pollSnap.data();
        const options = poll.options.map((opt: any) => {
          if (opt.id === optionId) {
            return { ...opt, votesCount: (opt.votesCount || 0) + 1 };
          }
          return opt;
        });
        await updateDoc(pollRef, { options });
      }
      return true;
    } else {
      const votes = mockStore.get('vyapar_votes');
      const alreadyVoted = votes.some((v: any) => v.pollId === pollId && v.userId === userId);
      if (alreadyVoted) return false;

      votes.push({ pollId, userId, optionId, votedAt: new Date().toISOString() });
      mockStore.set('vyapar_votes', votes);

      const polls = mockStore.get('vyapar_polls');
      const idx = polls.findIndex((p: any) => p.id === pollId);
      if (idx !== -1) {
        polls[idx].options = polls[idx].options.map((opt: any) => {
          if (opt.id === optionId) {
            return { ...opt, votesCount: (opt.votesCount || 0) + 1 };
          }
          return opt;
        });
        mockStore.set('vyapar_polls', polls);
      }
      return true;
    }
  },

  hasVoted: async (pollId: string, userId: string): Promise<boolean> => {
    if (isFirebaseConfigured && db) {
      const voteRef = doc(db, 'votes', `${pollId}_${userId}`);
      const snap = await getDoc(voteRef);
      return snap.exists();
    } else {
      const votes = mockStore.get('vyapar_votes');
      return votes.some((v: any) => v.pollId === pollId && v.userId === userId);
    }
  },

  // 8. Financial Expenses
  getExpenses: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'expenses'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_expenses').filter((e: any) => e.associationId === associationId);
    }
  },

  createExpense: async (exp: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'expenses'), exp);
    } else {
      const list = mockStore.get('vyapar_expenses');
      list.unshift({ id: `exp_${Date.now()}`, ...exp });
      mockStore.set('vyapar_expenses', list);
    }
  },

  // 9. Document Library
  getDocuments: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'documents'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_documents').filter((d: any) => d.associationId === associationId);
    }
  },

  createDocument: async (docInfo: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'documents'), docInfo);
    } else {
      const list = mockStore.get('vyapar_documents');
      list.unshift({ id: `doc_${Date.now()}`, ...docInfo });
      mockStore.set('vyapar_documents', list);
    }
  },

  // 10. Media Gallery
  getGallery: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'gallery'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_gallery').filter((g: any) => g.associationId === associationId);
    }
  },

  createGalleryItem: async (item: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'gallery'), item);
    } else {
      const list = mockStore.get('vyapar_gallery');
      list.unshift({ id: `gal_${Date.now()}`, ...item });
      mockStore.set('vyapar_gallery', list);
    }
  },

  createNotification: async (notif: any): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'notifications'), notif);
    } else {
      const list = mockStore.get('vyapar_notifications') || [];
      const newNotif = { id: `notif_${Date.now()}`, ...notif };
      list.unshift(newNotif);
      mockStore.set('vyapar_notifications', list);
    }
  },

  // Notifications
  getNotifications: async (associationId: string, userId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'notifications'), 
        where('associationId', '==', associationId),
        where('recipientId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_notifications').filter((n: any) => n.associationId === associationId && (n.recipientId === userId || n.recipientId === 'all'));
    }
  },

  markNotificationsAsRead: async (associationId: string, userId: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      // In Firebase we query read=false and bulk update to true (usually multiple individual calls)
      const q = query(
        collection(db, 'notifications'), 
        where('associationId', '==', associationId),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
      snap.docs.forEach(async (d) => {
        await updateDoc(doc(db, 'notifications', d.id), { read: true });
      });
    } else {
      const list = mockStore.get('vyapar_notifications');
      list.forEach((n: any) => {
        if (n.associationId === associationId && (n.recipientId === userId || n.recipientId === 'all')) {
          n.read = true;
        }
      });
      mockStore.set('vyapar_notifications', list);
    }
  },

  // Audit Logs
  getAuditLogs: async (associationId: string): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'audit_logs'), where('associationId', '==', associationId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return mockStore.get('vyapar_audit_logs').filter((l: any) => l.associationId === associationId);
    }
  },

  logAction: async (associationId: string, userId: string, userName: string, action: string, details: string): Promise<void> => {
    const log = {
      associationId,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'audit_logs'), log);
    } else {
      const list = mockStore.get('vyapar_audit_logs');
      list.unshift({ id: `log_${Date.now()}`, ...log });
      mockStore.set('vyapar_audit_logs', list);
    }
  },

  seedRealFirebase: async (): Promise<void> => {
    if (!isFirebaseConfigured || !db) return;
    
    // Write associations
    for (const assoc of INITIAL_ASSOCIATIONS) {
      await setDoc(doc(db, 'associations', assoc.id), assoc);
    }
    
    // Write users
    for (const user of INITIAL_USERS) {
      await setDoc(doc(db, 'users', user.uid), user);
    }
    
    // Write memberships
    for (const memb of INITIAL_MEMBERSHIPS) {
      await setDoc(doc(db, 'memberships', memb.id), memb);
    }
    
    // Write announcements
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      await setDoc(doc(db, 'announcements', ann.id), ann);
    }
    
    // Write campaigns
    for (const camp of INITIAL_CAMPAIGNS) {
      await setDoc(doc(db, 'campaigns', camp.id), camp);
    }
    
    // Write complaints
    for (const comp of INITIAL_COMPLAINTS) {
      await setDoc(doc(db, 'complaints', comp.id), comp);
    }
    
    // Write meetings
    for (const meet of INITIAL_MEETINGS) {
      await setDoc(doc(db, 'meetings', meet.id), meet);
    }
    
    // Write events
    for (const evt of INITIAL_EVENTS) {
      await setDoc(doc(db, 'events', evt.id), evt);
    }
    
    // Write polls
    for (const poll of INITIAL_POLLS) {
      await setDoc(doc(db, 'polls', poll.id), poll);
    }
    
    // Write expenses
    for (const exp of INITIAL_EXPENSES) {
      await setDoc(doc(db, 'expenses', exp.id), exp);
    }
    
    // Write business posts
    for (const post of INITIAL_BUSINESS_POSTS) {
      await setDoc(doc(db, 'business_posts', post.id), post);
    }
    
    // Write documents
    for (const docInfo of INITIAL_DOCUMENTS) {
      await setDoc(doc(db, 'documents', docInfo.id), docInfo);
    }
    
    // Write gallery
    for (const gal of INITIAL_GALLERY) {
      await setDoc(doc(db, 'gallery', gal.id), gal);
    }
  }
};

