import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { AIAssistant } from '../components/AIAssistant';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, logout, changeSimulatedRole } = useAuth();
  const { activeAssociation } = useTenant();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const menuItems = [
    { path: 'dashboard', label: 'dashboard', icon: '📊' },
    { path: 'directory', label: 'directory', icon: '📞' },
    { path: 'business', label: 'businessFeed', icon: '🏷️' },
    { path: 'announcements', label: 'announcements', icon: '📢' },
    { path: 'campaigns', label: 'campaigns', icon: '✊' },
    { path: 'complaints', label: 'complaints', icon: '🛠️' },
    { path: 'meetings', label: 'meetings', icon: '📅' },
    { path: 'events', label: 'events', icon: '🎉' },
    { path: 'polls', label: 'polls', icon: '🗳️' },
    { path: 'expenses', label: 'expenses', icon: '💰' },
    { path: 'gallery', label: 'gallery', icon: '🖼️' },
    { path: 'documents', label: 'documents', icon: '📁' },
  ];

  // Only show Admin page to authorized roles (Root, Admin)
  const canAccessAdmin = role === 'admin' || role === 'root';
  if (canAccessAdmin) {
    menuItems.push({ path: 'admin', label: 'admin', icon: '⚙️' });
  }

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const handleRoleChange = async (newRole: any) => {
    if (changeSimulatedRole) {
      await changeSimulatedRole(newRole);
      setShowRoleSwitcher(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      {/* Global Search Backdrop Panel */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Header Nav */}
      <header className="md:hidden glass border-b px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover border" />
          <span className="font-bold text-sm truncate max-w-[180px]">{activeAssociation?.name || 'Vyapar Mandal'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            title="Search"
          >
            🔍
          </button>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center font-bold text-xs"
          >
            {language === 'en' ? 'हि' : 'EN'}
          </button>
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 flex items-center justify-center text-xs font-bold border border-red-500/20"
            title={t('logout')}
          >
            🚪
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-lg"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside 
        className={`w-64 bg-card text-card-foreground border-r shrink-0 flex flex-col justify-between fixed md:sticky top-0 bottom-0 left-0 z-40 md:z-10 transition-transform duration-300 md:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Association branding top details */}
          <div className="p-4 border-b flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover border" />
              <div>
                <h2 className="font-extrabold text-xs tracking-wide uppercase line-clamp-1">
                  {activeAssociation?.name || 'Vyapar Mandal'}
                </h2>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Digital OS</p>
              </div>
            </Link>
            <button className="md:hidden text-lg text-muted-foreground hover:text-foreground" onClick={() => setIsSidebarOpen(false)}>
              ✕
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[70vh]">
            {menuItems.map((item) => {
              const fullPath = `/${item.path}`;
              const isActive = location.pathname.endsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={fullPath}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 font-bold scale-[1.01]' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{t(item.label)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section at bottom of sidebar */}
        <div className="p-4 border-t space-y-2 bg-muted/10">
          <div className="flex items-center gap-3">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'VM'}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border bg-white"
            />
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs truncate">{user?.displayName}</h4>
              <span className="text-[10px] text-primary font-black uppercase tracking-wider block">
                {role ? role.replace('_', ' ') : 'Guest'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1 pt-1">
            <button 
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 rounded py-1 font-semibold text-center border border-primary/20"
            >
              🔄 Switch Role
            </button>
            <button 
              onClick={handleLogout}
              className="text-[10px] bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded py-1 font-semibold text-center border border-red-500/20"
            >
              🚪 {t('logout')}
            </button>
          </div>

          {/* Quick Simulated Role Switcher Overlay Panel */}
          {showRoleSwitcher && (
            <div className="absolute bottom-16 left-4 right-4 bg-card border rounded-lg shadow-2xl p-3 z-50 animate-in slide-in-from-bottom-2 duration-150">
              <h5 className="font-bold text-xs mb-2 border-b pb-1 text-foreground flex justify-between items-center">
                <span>Select Simulated Role:</span>
                <button onClick={() => setShowRoleSwitcher(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </h5>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {['root', 'admin', 'member', 'guest'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`py-1 px-1.5 rounded text-left border ${
                      role === r 
                        ? 'bg-primary text-white font-bold border-primary' 
                        : 'hover:bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header Nav */}
        <header className="hidden md:flex justify-between items-center px-6 py-4 bg-card border-b z-20">
          {/* Left search indicator */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/75 border transition-all rounded-lg px-4 py-2 text-sm w-80 text-left cursor-pointer"
          >
            <span>🔍</span>
            <span className="flex-1">Search everything (Ctrl+K)</span>
            <span className="text-[10px] bg-card px-1.5 py-0.5 rounded border border-muted-foreground/30 shadow-sm">⌘K</span>
          </button>

          {/* Right quick actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="text-xs font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-full shadow-sm transition-all"
            >
              🌐 {t('languageToggle')}
            </button>
            <Link 
              to="/" 
              className="text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-full border shadow-sm transition-all"
            >
              🏠 Visit Website
            </Link>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/20 shadow-sm transition-all flex items-center gap-1.5"
            >
              🚪 {t('logout')}
            </button>
          </div>
        </header>

        {/* Dynamic Route Children Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          {children}
        </main>
      </div>

      {/* Speech-Enabled Floating Bot */}
      <AIAssistant />
    </div>
  );
};
