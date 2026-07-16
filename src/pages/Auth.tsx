import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Select, Dialog } from '../components/ui/CustomUI';

export const Auth: React.FC = () => {
  const { tenantId, activeAssociation } = useTenant();
  const { t, language } = useLanguage();
  const { loginWithEmail, signUpWithEmail, loginWithPhone, loginWithGoogle } = useAuth();
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
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Textiles');
  const [address, setAddress] = useState('');

  // Phone OTP specific states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Simulated checkout state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Loading & error statuses
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !phoneNumber || !shopName) return;
    
    // Open Simulated Payment checkout step
    setIsPaymentOpen(true);
  };

  const completeRegistration = async () => {
    setIsPaymentOpen(false);
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create global user profile in auth & database
      const newUser = await signUpWithEmail(email, password, displayName, phoneNumber);
      
      // Check if this is the first member (creator) of the association
      const existingMembers = await dataService.getMemberships(tenantId!);
      const isFirstMember = existingMembers.length === 0;

      // 2. Create association-specific membership profile
      const membership = {
        id: `${tenantId}_user_${newUser.uid}`,
        associationId: tenantId!,
        userId: newUser.uid,
        role: isFirstMember ? 'president' : 'business_member',
        status: isFirstMember ? 'active' : 'pending', // First member is auto-approved as president
        shopName,
        category,
        ownerName: displayName,
        phone: phoneNumber,
        email,
        address,
        businessDescription: 'Member signed up via portal',
        businessImages: [],
        products: [],
        services: [],
        paymentStatus: isFirstMember ? 'exempt' : 'paid_simulated',
        paymentAmount: isFirstMember ? 0 : 1100,
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        membershipCardNumber: isFirstMember ? `PRES-2026-0001` : `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      };

      await dataService.createOrUpdateMembership(membership);
      
      if (isFirstMember) {
        alert('First user registered! You have been auto-elevated as President. Welcome to your main portal!');
      } else {
        alert('Simulated payment of ₹1,100 received! Your registration has been submitted. Admins will review your details.');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create account profile');
    } finally {
      setSubmitting(false);
    }
  };

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
                        placeholder="e.g. president@vyapar.org" 
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
                  <span className="text-[10px] font-black uppercase text-primary tracking-wide block">💡 Demo Accounts:</span>
                  <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                    <div>President: <code>president@vyapar.org</code></div>
                    <div>Secretary: <code>secretary@vyapar.org</code></div>
                    <div>Password: <code>(any password)</code></div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SIGNUP MODE */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input required placeholder="Owner name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number</Label>
                    <Input required placeholder="+91 ..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Email ID</Label>
                    <Input required type="email" placeholder="e.g. shop@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Account Password</Label>
                    <Input required type="password" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Shop / Firm Name</Label>
                    <Input required placeholder="e.g. Balaji Stores" value={shopName} onChange={e => setShopName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Select
                      label="Business Category"
                      options={[
                        { value: 'Textiles', label: 'Textiles & Cloth' },
                        { value: 'Electronics', label: 'Electronics & Mobiles' },
                        { value: 'Groceries', label: 'Kirana & Groceries' },
                        { value: 'Jewellery', label: 'Jewellery & Ornaments' },
                        { value: 'Other', label: 'General / Service' }
                      ]}
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Shop Address Location</Label>
                  <Input required placeholder="e.g. Shop 42, Gali Qutubuddin" value={address} onChange={e => setAddress(e.target.value)} />
                </div>

                <Button type="submit" disabled={submitting} className="w-full font-bold shadow-md shadow-primary/10 mt-2">
                  {submitting ? 'Creating Profile...' : 'Register & Become Member'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Simulated Checkout Dialog */}
      <Dialog isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Mandal Membership Fee Payment">
        <div className="space-y-4 text-foreground text-sm">
          <div className="bg-primary/5 rounded-xl border p-4 text-center space-y-2">
            <h4 className="font-extrabold text-base text-primary">Jhusi Vyapar Mandal, Prayagraj</h4>
            <p className="text-xs text-muted-foreground">Annual Membership Subscription Fee</p>
            <div className="text-3xl font-black text-foreground pt-2">₹1,100 <span className="text-xs font-normal text-muted-foreground">/ year</span></div>
          </div>

          <div className="space-y-3.5 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              To complete your shopkeeper profile registry, scan the mock QR code below using any UPI app (PhonePe/Paytm/GPay) or click the mock pay button to simulate transaction success.
            </p>

            {/* UPI QR Mock Box */}
            <div className="w-40 h-40 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 mx-auto p-2">
              <div className="w-full h-full border border-primary/20 rounded flex flex-col items-center justify-center gap-1 font-mono text-[9px] text-primary bg-white shadow-sm">
                <span>[ UPI QR CODE ]</span>
                <span className="font-sans text-[8px] text-muted-foreground font-semibold">merchant@upi</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 text-amber-600 rounded-lg text-[10px] border border-amber-500/15 leading-tight font-medium">
              ⚠️ Note: This is a simulated checkout sandbox. No real currency will be charged or collected from your account.
            </div>
          </div>

          <div className="flex gap-2 border-t pt-4">
            <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="flex-1 font-bold" onClick={completeRegistration}>
              ⚡ Simulate Success
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
