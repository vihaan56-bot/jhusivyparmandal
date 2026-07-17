import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Dialog } from '../components/ui/CustomUI';

export const Auth: React.FC = () => {
  const { tenantId, activeAssociation } = useTenant();
  const { t, language } = useLanguage();
  const { user, loginWithEmail, signUpWithEmail, loginWithPhone, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode toggles
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    return location.state?.mode === 'signup' ? 'signup' : 'login';
  });
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Phone OTP specific states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Loading & error statuses
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect authenticated users with password change completed
  React.useEffect(() => {
    if (user && !user.needsPasswordChange) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(t('❌ Invalid email or password credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneOTPRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setSubmitting(true);

    // Simulate OTP sending
    setTimeout(() => {
      setOtpSent(true);
      setSubmitting(false);
    }, 1000);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !otpCode) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await loginWithPhone(phoneNumber, otpCode);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(t('❌ Invalid verification code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to log in with Google');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !phoneNumber) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await signUpWithEmail(email, password, displayName, phoneNumber);
      alert(t('Account created successfully! Redirecting to Member Dashboard.'));
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create account profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg(t('❌ Passwords do not match.'));
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(t('❌ Password must be at least 6 characters long.'));
      return;
    }

    setUpdatingPassword(true);
    setErrorMsg(null);

    try {
      await authService.updateCurrentUserPassword(newPassword);
      
      // Update Firestore profile
      if (user) {
        const updatedProfile = { ...user, needsPasswordChange: false };
        await dataService.createUserProfile(updatedProfile);
        alert(t('Password updated successfully! Welcome to your dashboard.'));
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Render Password Reset Force Screen if user has the flag set
  if (user && user.needsPasswordChange) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-1/4 -left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-10 w-72 h-72 rounded-full bg-secondary/5 blur-3xl" />
        
        <Card className="w-full max-w-md shadow-2xl relative border-primary/20 bg-card">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mx-auto">🛡️</div>
            <CardTitle className="text-xl font-black">Password Update Required</CardTitle>
            <CardDescription>
              For security, you must update your password on your first login before accessing your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleForcePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input 
                  required 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input 
                  required 
                  type="password" 
                  placeholder="Verify new password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2.5 rounded border border-red-500/20 leading-tight">
                  {errorMsg}
                </p>
              )}

              <Button type="submit" disabled={updatingPassword} className="w-full font-bold shadow-lg shadow-primary/10">
                {updatingPassword ? 'Updating credentials...' : 'Update & Verify Account'}
              </Button>
            </form>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full font-semibold border-red-500/20 text-red-600 hover:bg-red-500/10" 
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              🚪 Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dynamic Branding Background Layer */}
      <div 
        className="absolute top-0 left-0 right-0 h-2/5 opacity-10 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${activeAssociation?.primaryColor || '#0284c7'} 0%, transparent 100%)`
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Mandal Header */}
        <div className="text-center space-y-3">
          {activeAssociation?.logoUrl ? (
            <img 
              src={activeAssociation.logoUrl} 
              alt="Logo" 
              className="w-16 h-16 rounded-full mx-auto object-cover border bg-white shadow"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-2xl text-primary mx-auto">
              VM
            </div>
          )}
          <div>
            <h2 className="font-extrabold text-lg text-foreground tracking-tight">
              {activeAssociation?.name || 'Vyapar Mandal'}
            </h2>
            <p className="text-xs text-muted-foreground">Digital Operating System Portal</p>
          </div>
        </div>

        {/* Auth form card */}
        <Card className="shadow-2xl">
          <CardHeader className="border-b bg-muted/10 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                className={`flex-1 py-2 font-bold text-xs uppercase border-b-2 text-center transition-all ${
                  authMode === 'login' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                🔑 Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                className={`flex-1 py-2 font-bold text-xs uppercase border-b-2 text-center transition-all ${
                  authMode === 'signup' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                🤝 Sign Up (Become Member)
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 pt-4 space-y-4">
            {errorMsg && (
              <p className="text-xs font-semibold p-2.5 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 text-center animate-shake">
                {errorMsg}
              </p>
            )}

            {/* 1. LOGIN MODE */}
            {authMode === 'login' && (
              <div className="space-y-4">
                {/* Method selector subtabs */}
                <div className="flex gap-2 border rounded-lg p-1 bg-muted/40 text-xs">
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-1.5 font-bold rounded ${loginMethod === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Email Login
                  </button>
                  <button
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-1.5 font-bold rounded ${loginMethod === 'phone' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Phone OTP
                  </button>
                </div>

                {/* Email Form */}
                {loginMethod === 'email' && (
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="space-y-1">
                      <Label>Registered Email</Label>
                      <Input 
                        required 
                        type="email" 
                        placeholder="e.g. root@vyparmandal.org" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input 
                        required 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                      />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full font-bold shadow-md shadow-primary/10">
                      {submitting ? 'Signing In...' : 'Verify & Log In'}
                    </Button>
                  </form>
                )}

                {/* Phone OTP Form */}
                {loginMethod === 'phone' && (
                  <div className="space-y-3">
                    {!otpSent ? (
                      <form onSubmit={handlePhoneOTPRequest} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Mobile Number</Label>
                          <Input 
                            required 
                            placeholder="e.g. +91 98765 43210" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)} 
                          />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full font-bold shadow-md shadow-primary/10">
                          {submitting ? 'Sending Code...' : 'Send SMS OTP Code'}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handlePhoneLogin} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Enter 6-Digit OTP Code</Label>
                          <Input 
                            required 
                            placeholder="e.g. 123456" 
                            value={otpCode} 
                            onChange={e => setOtpCode(e.target.value)} 
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={submitting} className="w-full font-bold shadow-md shadow-primary/10">
                            {submitting ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setOtpSent(false)} className="shrink-0 font-bold">
                            Reset
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Google Login button */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Or continue with</span>
                  <div className="flex-grow border-t"></div>
                </div>

                <Button 
                  onClick={handleGoogleLogin} 
                  type="button" 
                  variant="outline" 
                  className="w-full font-bold flex items-center justify-center gap-2 border bg-card"
                >
                  🌐 Log In with Google
                </Button>
                
                {/* Seed Accounts Helper tip */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-primary tracking-wide block">💡 Seeded Roles:</span>
                  <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                    <div>Root Admin: <code>root@vyparmandal.org</code></div>
                    <div>Default Password: <code>changeMeRoot123!</code></div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SIGNUP MODE */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input required placeholder="Owner name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile Number</Label>
                  <Input required placeholder="e.g. +91 98765 43210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email ID</Label>
                  <Input required type="email" placeholder="e.g. shop@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Password</Label>
                  <Input required type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <Button type="submit" disabled={submitting} className="w-full font-bold shadow-md shadow-primary/10 mt-2">
                  {submitting ? 'Creating Profile...' : 'Register Member Account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
