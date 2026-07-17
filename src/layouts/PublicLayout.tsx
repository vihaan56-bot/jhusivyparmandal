import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeAssociation } = useTenant();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="border-b bg-card sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover border" />
              <Link to="/" className="font-extrabold text-sm sm:text-base text-foreground tracking-tight line-clamp-1">
                {t('Jhusi Vyapar Mandal')}
              </Link>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/" 
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
              >
                {t('about')}
              </Link>
              <Link 
                to="/login" 
                className="text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md shadow-primary/10 transition-all active:scale-95"
              >
                {t('login')}
              </Link>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="text-xs font-black bg-muted text-muted-foreground hover:bg-accent px-2.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer"
              >
                {language === 'en' ? 'हि' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-foreground">{t('Jhusi Vyapar Mandal')}</p>
          <p>Digital Operating System powered by Vyapar Mandal Platform © 2026. All rights reserved.</p>
          <p className="text-[10px] text-muted-foreground/60">{activeAssociation?.address}</p>
        </div>
      </footer>
    </div>
  );
};
