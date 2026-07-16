import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { aiService } from '../services/aiService';
import { Button, Card } from './ui/CustomUI';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const { tenantId, activeAssociation } = useTenant();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Namaskar! I am your Vyapar Mandal Digital Assistant. Ask me anything about meetings, active campaigns, or complaint statuses. You can also click the mic to speak in Hindi or English!',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSessionRef = useRef<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clean up speaking on unmount
  useEffect(() => {
    return () => {
      aiService.stopSpeaking();
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !tenantId) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate bot loading state
    const typingMsg: Message = {
      id: 'typing',
      text: 'Thinking...',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      const replyText = await aiService.askAI(tenantId, text);
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: `msg_${Date.now()}_b`,
            text: replyText,
            sender: 'bot',
            timestamp: new Date()
          }
        ];
      });

      // Speak response automatically if configured or requested
      if (isSpeaking) {
        aiService.speakText(replyText, language);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: `msg_${Date.now()}_err`,
            text: 'Apologies, I encountered an issue querying the database. Please try again.',
            sender: 'bot',
            timestamp: new Date()
          }
        ];
      });
    }
  };

  const toggleListen = () => {
    if (isListening) {
      speechSessionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      const session = aiService.createSpeechToTextSession(
        (recognizedText) => {
          setInputValue(recognizedText);
          setIsListening(false);
          // Auto submit spoken query
          handleSendMessage(recognizedText);
        },
        (errorMsg) => {
          setIsListening(false);
          alert(`Speech Error: ${errorMsg}`);
        }
      );

      if (session) {
        speechSessionRef.current = session;
        session.start(language);
      } else {
        setIsListening(false);
      }
    }
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      // Speak the last bot message
      const botMsgs = messages.filter(m => m.sender === 'bot');
      if (botMsgs.length > 0) {
        aiService.speakText(botMsgs[botMsgs.length - 1].text, language);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const suggestions = [
    language === 'hi' ? 'अगली बैठक कब है?' : 'When is the next meeting?',
    language === 'hi' ? 'लंबित शिकायतें क्या हैं?' : 'What are pending complaints?',
    language === 'hi' ? 'सड़क मरम्मत का क्या हुआ?' : 'What is happening with the road repair?'
  ];

  if (!tenantId) return null; // Only render when inside a specific association context

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Bot Dialogue Card */}
      {isOpen && (
        <Card 
          glass 
          className="w-[90vw] sm:w-[400px] h-[500px] mb-4 flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200 border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden"
        >
          {/* Header */}
          <div 
            className="p-4 text-white flex items-center justify-between shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${activeAssociation?.primaryColor || '#0284c7'} 0%, ${activeAssociation?.secondaryColor || '#f59e0b'} 100%)`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h4 className="font-bold text-sm">Vyapar AI Assistant</h4>
                <p className="text-[10px] opacity-90">Hindi & English Speech Enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* TTS Toggle Button */}
              <button 
                onClick={toggleSpeak} 
                className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isSpeaking ? 'text-yellow-300 font-bold' : 'text-white/70'}`}
                title="Toggle Text to Speech"
              >
                {isSpeaking ? '🔊' : '🔇'}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-card border text-card-foreground rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className="block text-[9px] text-right mt-1 opacity-60">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips suggestion wrapper */}
          <div className="px-4 py-2 bg-muted/20 border-t flex flex-wrap gap-1.5 overflow-x-auto whitespace-nowrap">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="text-[11px] bg-card text-foreground hover:bg-primary/10 border hover:border-primary/30 rounded-full px-2.5 py-1 transition-all"
              >
                💡 {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t bg-card flex items-center gap-2">
            <button
              onClick={toggleListen}
              className={`p-2.5 rounded-full border transition-all shrink-0 active:scale-95 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse border-red-600' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              title="Speak Hindi / English"
            >
              🎙️
            </button>
            <input
              type="text"
              placeholder={isListening ? 'Listening (सुन रहा हूँ)...' : 'Ask about meetings, campaigns...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              className="w-full text-sm border bg-background rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              disabled={isListening}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              variant="primary"
              size="sm"
              className="rounded-full w-9 h-9 shrink-0 flex items-center justify-center"
              disabled={!inputValue.trim() || isListening}
            >
              ➔
            </Button>
          </div>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl text-2xl transition-all duration-300 hover:scale-105 active:scale-95 animate-bounce-slow"
        style={{
          background: `linear-gradient(135deg, ${activeAssociation?.primaryColor || '#0284c7'} 0%, ${activeAssociation?.secondaryColor || '#f59e0b'} 100%)`
        }}
      >
        💬
      </button>
    </div>
  );
};
