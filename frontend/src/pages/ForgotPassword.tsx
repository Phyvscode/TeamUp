import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff,
  Loader2, CheckCircle, RefreshCw, ShieldAlert,
} from 'lucide-react';

const API = 'http://localhost:5000';

// ── Step types ────────────────────────────────────────────────────────────────
type Step = 'email' | 'code' | 'password' | 'done';

// ── Password rules (same as login) ───────────────────────────────────────────
const RULES = [
  { label: 'At least 8 characters',      test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number (0-9)',            test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',       test: (p: string) => /[!@#$%^&*()\-_=+[\]{};':",.<>/?@]/.test(p) },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepDot = ({ active, done }: { active: boolean; done: boolean }) => (
  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
    done   ? 'bg-green-500' :
    active ? 'bg-primary scale-125' :
             'bg-muted'
  }`} />
);

const ForgotPassword = () => {
  const navigate  = useNavigate();
  const [step,    setStep]    = useState<Step>('email');

  // Step 1
  const [email,   setEmail]   = useState('');

  // Step 2
  const [digits,  setDigits]  = useState(['', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [attemptsLeft,  setAttemptsLeft]  = useState<number | null>(null);
  const [lockedUntil,   setLockedUntil]   = useState<Date | null>(null);
  const [countdown,     setCountdown]     = useState('');

  // Step 3
  const [resetToken,    setResetToken]    = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [confirmPass,   setConfirmPass]   = useState('');
  const [showNew,       setShowNew]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  // Shared
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Lockout countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const diff = lockedUntil.getTime() - Date.now();
      if (diff <= 0) {
        setLockedUntil(null);
        setCountdown('');
        setError('');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // ── Step 1: Send code ─────────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP digit input handlers ─────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;           // only single digit
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus();    // auto-advance
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();    // backspace moves back
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      digitRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify code ───────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/verify-reset-code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLockedUntil(new Date(data.lockedUntil));
        setError(data.message);
        return;
      }
      if (!res.ok) {
        if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
        setDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
        throw new Error(data.message);
      }
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ────────────────────────────────────────────────
  const rules        = RULES.map((r) => ({ ...r, met: r.test(newPassword) }));
  const allRulesMet  = rules.every((r) => r.met);
  const passMatch    = newPassword === confirmPass && confirmPass !== '';
  const strengthScore = rules.filter((r) => r.met).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = strengthScore <= 1 ? 'bg-destructive' : strengthScore === 2 ? 'bg-yellow-500' : strengthScore === 3 ? 'bg-primary' : 'bg-green-500';

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) { setError('Password does not meet all requirements.'); return; }
    if (!passMatch)   { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    setError('');
    setDigits(['', '', '', '', '', '']);
    setAttemptsLeft(null);
    setLockedUntil(null);
    setLoading(true);
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
    } catch {}
    setLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'var(--gradient-glow)' }} />

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Back button */}
        {step !== 'done' && (
          <button
            onClick={() => step === 'email' ? navigate('/auth') : setStep(step === 'code' ? 'email' : 'code')}
            className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'email' ? 'Back to login' : 'Back'}
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-8 shadow-card"
        >
          {/* Step dots */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {(() => {
                const s = step as string;
                return (
                  <>
                    <StepDot active={s === 'email'}    done={s === 'code' || s === 'password' || s === 'done'} />
                    <StepDot active={s === 'code'}     done={s === 'password' || s === 'done'} />
                    <StepDot active={s === 'password'} done={(s as string) === 'done'} />
                  </>
                );
              })()}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Email ───────────────────────────────────────────── */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">Forgot Password</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Enter your email and we'll send a verification code.</p>
                  </div>
                </div>

                {error && <ErrorBox message={error} />}

                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email Address</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-orange text-primary-foreground hover:opacity-90"
                    disabled={loading || !email}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    {loading ? 'Sending…' : 'Send Verification Code'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── STEP 2: Code ────────────────────────────────────────────── */}
            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">Enter Code</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
                    </p>
                  </div>
                </div>

                {error && <ErrorBox message={error} icon={attemptsLeft !== null || lockedUntil ? 'warn' : 'error'} />}

                {/* Lockout UI */}
                {lockedUntil ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center mb-4">
                    <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-3 opacity-70" />
                    <p className="text-sm font-semibold text-foreground mb-1">Account temporarily locked</p>
                    <p className="text-xs text-muted-foreground mb-4">Too many incorrect attempts. Try again in:</p>
                    <p className="text-3xl font-bold font-display text-destructive">{countdown}</p>
                  </div>
                ) : (
                  <>
                    {/* 6-digit OTP boxes */}
                    <div className="flex gap-2 justify-center mb-5" onPaste={handleDigitPaste}>
                      {digits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { digitRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleDigitChange(i, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(i, e)}
                          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border bg-muted/30 text-foreground
                            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all
                            ${d ? 'border-primary bg-primary/5' : 'border-border'}`}
                        />
                      ))}
                    </div>

                    {/* Attempts warning */}
                    {attemptsLeft !== null && (
                      <p className="text-center text-xs text-yellow-500 mb-4">
                        ⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before 1-hour lockout
                      </p>
                    )}

                    <Button
                      onClick={handleVerify}
                      className="w-full bg-gradient-orange text-primary-foreground hover:opacity-90 mb-4"
                      disabled={loading || digits.join('').length < 6}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                      {loading ? 'Verifying…' : 'Verify Code'}
                    </Button>
                  </>
                )}

                {/* Resend */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Didn't receive the code?</p>
                  <button
                    onClick={handleResend}
                    disabled={loading || !!lockedUntil}
                    className="text-sm text-primary hover:underline disabled:opacity-40 flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: New Password ─────────────────────────────────────── */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">New Password</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Choose a strong new password for your account.</p>
                  </div>
                </div>

                {error && <ErrorBox message={error} />}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-new">New Password</Label>
                    <div className="relative">
                      <Input
                        id="fp-new"
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        {[1,2,3,4].map((n) => (
                          <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= strengthScore ? strengthColor : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${
                        strengthScore <= 1 ? 'text-destructive' : strengthScore === 2 ? 'text-yellow-500' : strengthScore === 3 ? 'text-primary' : 'text-green-500'
                      }`}>{strengthLabel}</p>
                    </div>
                  )}

                  {/* Requirements */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${rule.met ? 'bg-green-500' : 'bg-muted border border-border'}`}>
                          {rule.met && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${rule.met ? 'text-foreground' : 'text-muted-foreground'}`}>{rule.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Confirm */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="fp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Match indicator */}
                  {confirmPass.length > 0 && (
                    <div className={`flex items-center gap-2 text-xs font-medium ${passMatch ? 'text-green-500' : 'text-destructive'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${passMatch ? 'bg-green-500' : 'bg-destructive'}`}>
                        {passMatch ? (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      {passMatch ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-orange text-primary-foreground hover:opacity-90"
                    disabled={loading || !allRulesMet || !passMatch}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    {loading ? 'Updating…' : 'Reset Password'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── DONE ────────────────────────────────────────────────────── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold font-display text-foreground mb-2">Password Reset!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-gradient-orange text-primary-foreground hover:opacity-90"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ── Small reusable error box ──────────────────────────────────────────────────
const ErrorBox = ({ message, icon = 'error' }: { message: string; icon?: 'error' | 'warn' }) => (
  <div className={`rounded-lg border p-3 text-sm mb-4 ${
    icon === 'warn'
      ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500'
      : 'border-destructive/50 bg-destructive/10 text-destructive'
  }`}>
    {message}
  </div>
);

export default ForgotPassword;