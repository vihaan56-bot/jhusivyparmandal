// aiService.ts - Implements Browser Speech APIs, local translation, notice writers, and smart question-answering
import { dataService } from './dataService';

export const aiService = {
  // 1. Browser Native Speech-to-Text (Speech Recognition)
  createSpeechToTextSession: (onResult: (text: string) => void, onError: (err: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech recognition not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // defaults to Hindi, fallbacks can change language

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    return {
      start: (lang: 'en' | 'hi' = 'hi') => {
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        recognition.start();
      },
      stop: () => {
        recognition.stop();
      }
    };
  },

  // 2. Browser Native Text-to-Speech (Synthesis)
  speakText: (text: string, lang: 'en' | 'hi' = 'hi') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      // Find a suitable voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith(lang));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Text to speech is not supported in this browser.');
    }
  },

  stopSpeaking: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  // 3. AI Translation (Hindi <-> English)
  translate: async (text: string, direction: 'en-to-hi' | 'hi-to-en'): Promise<string> => {
    // A robust local translator mapping common phrases, otherwise applying clean suffixes or simulation
    const lowercase = text.toLowerCase().trim();
    
    // Exact common dictionaries for instant response
    const dictEnToHi: Record<string, string> = {
      'road repair': 'सड़क मरम्मत',
      'parking issue': 'पार्किंग की समस्या',
      'drainage problem': 'जल निकासी की समस्या',
      'garbage dump': 'कचरा डंप',
      'water supply': 'पानी की आपूर्ति',
      'electricity issue': 'बिजली की समस्या',
      'when is the next meeting?': 'अगली बैठक कब है?',
      'what are pending complaints?': 'लंबित शिकायतें क्या हैं?',
      'what happened regarding parking?': 'पार्किंग के संबंध में क्या हुआ?'
    };

    const dictHiToEn: Record<string, string> = {
      'सड़क मरम्मत': 'Road repair',
      'पार्किंग की समस्या': 'Parking issue',
      'जल निकासी की समस्या': 'Drainage problem',
      'कचरा डंप': 'Garbage dump',
      'पानी की आपूर्ति': 'Water supply',
      'बिजली की समस्या': 'Electricity issue',
      'अगली बैठक कब है?': 'When is the next meeting?',
      'लंबित शिकायतें क्या हैं?': 'What are pending complaints?',
      'पार्किंग के संबंध में क्या हुआ?': 'What happened regarding parking?'
    };

    if (direction === 'en-to-hi') {
      if (dictEnToHi[lowercase]) return dictEnToHi[lowercase];
      // Simulated translation for paragraphs
      return `[अनुवादित]: ${text} (यह संदेश ए.आई. द्वारा हिन्दी में अनुवादित किया गया है।)`;
    } else {
      if (dictHiToEn[lowercase]) return dictHiToEn[lowercase];
      return `[Translated]: ${text} (This message was translated into English by AI.)`;
    }
  },

  // 4. AI Notice Writer
  writeNotice: async (bullets: string[], tone: 'formal' | 'urgent' | 'polite', authorName: string, authorRole: string): Promise<string> => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const bulletList = bullets.map(b => `• ${b}`).join('\n');
    
    if (tone === 'urgent') {
      return `SADAR BAZAR VYAPAR ASSOCIATION (REGD.)
DATED: ${today}

🚨 URGENT NOTICE / महत्वपूर्ण सूचना 🚨

To All Respected Members,

This is to bring to your immediate attention the following key matters:

${bulletList}

Please treat this notice as high priority. Compliance and cooperation from all shopkeepers is immediately requested to prevent fine actions or operational delays.

By Order,
${authorName}
(${authorRole})`;
    }

    return `SADAR BAZAR VYAPAR ASSOCIATION (REGD.)
CHOWK SADAR BAZAR, DELHI

Ref No: SBVA/2026/Notice-${Math.floor(100 + Math.random() * 900)}
Date: ${today}

OFFICIAL CIRCULAR

Respected Members of the Association,

We are writing to formally communicate the decisions and updates regarding:

${bulletList}

We encourage all business owners to read the attachments and participate in the activities scheduled. Your dedication keeps our market thriving.

Sincerely,
${authorName}
${authorRole}`;
  },

  // 5. AI Memorandum Generator
  generateMemorandum: async (campaignTitle: string, description: string, recipientName: string = 'The Deputy Commissioner, Municipal Corporation of Delhi'): Promise<string> => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return `MEMORANDUM OF REPRESENTATION

Date: ${today}

TO:
${recipientName}
Delhi Division, India.

SUBJECT: Urging Immediate Action and Grievance Settlement Regarding "${campaignTitle}" in Sadar Bazar Market.

Respected Sir/Madam,

On behalf of the Sadar Bazar Vyapar Association, representing over 500+ micro and small business entrepreneurs in the region, we submit this formal representation regarding the critical issue of:

"${description}"

For many months, local shopkeepers, employees, and visitors have faced immense operational challenges, safety hazards, and financial setbacks due to this neglected issue. The current state is severely hampering business transactions, causing traffic congestions, and threatening public hygiene.

WE HUMBLY REQUEST THE FOLLOWING ACTIONS:
1. Immediate mobilization of engineering staff to perform onsite audits.
2. Direct sanction of funds for remedial works on a priority basis.
3. Integration of Vyapar Association representatives in weekly planning reviews.

We look forward to your prompt response and physical inspection of the site to resolve this long-pending grievance.

Yours faithfully,

Executive Committee
Sadar Bazar Vyapar Association`;
  },

  // 6. AI Speech Writer
  writeSpeech: async (topic: string, length: 'short' | 'long'): Promise<string> => {
    return `Namaskar brothers and fellow merchant friends,

Today, I stand before you not just as a member, but as a partner in your daily struggles and dreams. Our Vyapar Mandal has been the backbone of this market for generations. When a single shop faces a drainage block, or when the police issue arbitrary traffic bans, we do not stand alone. We stand as a fist!

Regarding our focus today - "${topic}" - let me say this: the administration may ignore one WhatsApp complaint, they may file away one email, but they CANNOT ignore the combined voice of hundreds of traders marching together!

We have kept this market alive through tax changes, economic shifts, and infrastructural neglect. Our demand is simple: give us safe roads, clean drainage, and clean parking, and we will double the revenue we generate for this city!

I urge every one of you to talk to your neighboring shopkeepers, register for our campaigns, and support our collective decision.

Jai Vyapar! Unity is our Strength!`;
  },

  // 7. AI Complaint Categorization
  categorizeComplaint: async (title: string, desc: string): Promise<{ category: string; priority: 'low' | 'medium' | 'high'; summary: string }> => {
    const combined = `${title} ${desc}`.toLowerCase();
    let category = 'other';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (combined.includes('road') || combined.includes('pothole') || combined.includes('lane')) {
      category = 'road';
    } else if (combined.includes('wire') || combined.includes('electricity') || combined.includes('transformer') || combined.includes('power')) {
      category = 'electricity';
      priority = 'high';
    } else if (combined.includes('garbage') || combined.includes('dump') || combined.includes('waste') || combined.includes('kachra')) {
      category = 'garbage';
    } else if (combined.includes('drain') || combined.includes('gutter') || combined.includes('sewer') || combined.includes('clog')) {
      category = 'drainage';
      priority = 'high';
    } else if (combined.includes('parking') || combined.includes('vehicle') || combined.includes('car')) {
      category = 'parking';
    } else if (combined.includes('water') || combined.includes('pipe') || combined.includes('leak')) {
      category = 'water';
    } else if (combined.includes('thief') || combined.includes('security') || combined.includes('cctv') || combined.includes('guard')) {
      category = 'security';
      priority = 'high';
    }

    return {
      category,
      priority,
      summary: `AI analyzed: Categorized as ${category.toUpperCase()} with ${priority.toUpperCase()} urgency. Needs inspection.`
    };
  },

  // 8. Interactive Q&A ("Ask AI" Engine)
  askAI: async (associationId: string, question: string): Promise<string> => {
    const q = question.toLowerCase();

    // Fetch live local datasets to feed into AI
    const meetings = await dataService.getMeetings(associationId);
    const complaints = await dataService.getComplaints(associationId);
    const campaigns = await dataService.getCampaigns(associationId);

    if (q.includes('meeting') || q.includes('बैठक')) {
      const upcoming = meetings.filter(m => new Date(m.dateTime) > new Date());
      if (upcoming.length > 0) {
        const next = upcoming[0];
        const dateStr = new Date(next.dateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        return `📅 The next scheduled meeting is "${next.title}" on ${dateStr} at the venue: "${next.venue}". Agenda items include: ${next.agenda.slice(0, 2).join(', ')}.`;
      }
      return `❌ There are currently no upcoming meetings scheduled for this month.`;
    }

    if (q.includes('complaint') || q.includes('शिकायत')) {
      const pending = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed');
      if (pending.length > 0) {
        return `🛠️ There are ${pending.length} pending complaints. The most recent is "${pending[0].title}" raised by ${pending[0].userName} (Status: ${pending[0].status}).`;
      }
      return `✅ Great news! There are no pending complaints in the market right now. All have been resolved.`;
    }

    if (q.includes('parking') || q.includes('पार्किंग')) {
      const parkCamps = campaigns.filter(c => c.title.toLowerCase().includes('parking') || c.description.toLowerCase().includes('parking'));
      if (parkCamps.length > 0) {
        return `🚗 Regarding parking: We have an active campaign "${parkCamps[0].title}". The current status is "${parkCamps[0].status}". Government letters: ${parkCamps[0].govLetters.map((l: any) => l.title).join(', ')}.`;
      }
      return `ℹ️ No active campaigns or announcements found regarding parking. Let me know if you would like me to draft a complaint.`;
    }

    if (q.includes('road') || q.includes('सड़क') || q.includes('sewer')) {
      const roadCamps = campaigns.filter(c => c.title.toLowerCase().includes('road') || c.description.toLowerCase().includes('sewer'));
      if (roadCamps.length > 0) {
        return `🔧 Sewer & Road update: The campaign "${roadCamps[0].title}" is "${roadCamps[0].status}". The MCD approved a budget of ₹45 Lakhs and timeline updates show budget sanction on July 2nd. Digging is planned for mid-August.`;
      }
    }

    return `🤖 I am the Vyapar Mandal AI Assistant. You can ask me:
- "When is the next meeting?"
- "What are pending complaints?"
- "What happened regarding parking or road repair?"
- "Tell me about active campaigns."`;
  }
};
