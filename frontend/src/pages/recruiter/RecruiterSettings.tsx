import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  User, Building2, Lock, Camera, Loader2, CheckCircle,
  Save, Eye, EyeOff, Globe, Users, Briefcase, MapPin, Phone, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const token = () => localStorage.getItem('auth_token');
const API   = 'http://localhost:5000';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+'];
const INDUSTRIES    = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-Commerce',
  'Marketing', 'Design', 'Legal', 'Manufacturing', 'Other',
];

type Tab = 'profile' | 'company' | 'password';

interface RecruiterProfile {
  name:               string;
  email:              string;
  phone:              string;
  location:           string;
  avatar:             string;
  company:            string;
  companyLogo:        string;
  companyWebsite:     string;
  companyIndustry:    string;
  companySize:        string;
  companyDescription: string;
}

const RecruiterSettings = () => {
  const [tab,     setTab]     = useState<Tab>('profile');
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/profile`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setProfile(await res.json());
    } catch {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'My Profile',    icon: User      },
    { key: 'company', label: 'Company',        icon: Building2 },
    { key: 'password',label: 'Password',       icon: Lock      },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        <h1 className="text-3xl font-bold font-display text-foreground mb-8">Settings</h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Tab sidebar ─────────────────────────────────────────── */}
            <div className="lg:w-52 shrink-0">
              <nav className="rounded-xl border border-border bg-card shadow-card p-2 flex flex-row lg:flex-col gap-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                      tab === t.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <t.icon className="w-4 h-4 shrink-0" />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Tab panels ──────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {tab === 'profile'  && profile && <ProfileTab  profile={profile} setProfile={setProfile} />}
              {tab === 'company'  && profile && <CompanyTab  profile={profile} setProfile={setProfile} />}
              {tab === 'password' &&            <PasswordTab />}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

/* ── Profile Tab ─────────────────────────────────────────────────────────── */
const ProfileTab = ({ profile, setProfile }: { profile: RecruiterProfile; setProfile: any }) => {
  const [form,    setForm]    = useState({ name: profile.name, email: profile.email, phone: profile.phone, location: profile.location });
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      toast.success('Profile saved.');
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch(`${API}/api/profile/avatar`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      toast.success('Profile photo updated.');
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-6">
      <h2 className="text-lg font-bold font-display text-foreground">My Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {profile.avatar
              ? <img src={`${API}${profile.avatar}`} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-primary font-bold text-2xl">{profile.name.charAt(0).toUpperCase()}</span>
            }
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WebP · max 5 MB</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Full Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone</Label>
          <Input placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location</Label>
          <Input placeholder="City, Country" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
      </Button>
    </div>
  );
};

/* ── Company Tab ─────────────────────────────────────────────────────────── */
const CompanyTab = ({ profile, setProfile }: { profile: RecruiterProfile; setProfile: any }) => {
  const [form, setForm] = useState({
    company:            profile.company            || '',
    companyWebsite:     profile.companyWebsite     || '',
    companyIndustry:    profile.companyIndustry    || '',
    companySize:        profile.companySize        || '',
    companyDescription: profile.companyDescription || '',
  });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      toast.success('Company info saved.');
    } catch {
      toast.error('Failed to save company info.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch(`${API}/api/profile/company-logo`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      toast.success('Company logo updated.');
    } catch {
      toast.error('Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-6">
      <h2 className="text-lg font-bold font-display text-foreground">Company Information</h2>

      {/* Company logo */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
            {profile.companyLogo
              ? <img src={`${API}${profile.companyLogo}`} alt="logo" className="w-full h-full object-contain p-1" />
              : <Building2 className="w-8 h-8 text-muted-foreground" />
            }
          </div>
          <button
            onClick={() => logoRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{profile.company || 'Your Company'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WebP · max 5 MB</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Company Name</Label>
          <Input placeholder="Acme Corp" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website</Label>
          <Input placeholder="https://acmecorp.com" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Industry</Label>
          <select
            value={form.companyIndustry}
            onChange={(e) => setForm({ ...form, companyIndustry: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Company Size</Label>
          <select
            value={form.companySize}
            onChange={(e) => setForm({ ...form, companySize: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select size…</option>
            {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Company Description</Label>
        <Textarea
          placeholder="Tell applicants what your company does, your culture, and why they should join…"
          rows={4}
          value={form.companyDescription}
          onChange={(e) => setForm({ ...form, companyDescription: e.target.value })}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Company Info</>}
      </Button>
    </div>
  );
};

/* ── Standalone PasswordField — must be outside component to avoid remount ── */
const PasswordField = ({
  id, label, value, show, onToggle, onChange,
}: {
  id: string; label: string; value: string;
  show: boolean; onToggle: () => void; onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

/* ── Password Tab ────────────────────────────────────────────────────────── */
const PasswordTab = () => {
  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving,  setSaving]  = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [success, setSuccess] = useState(false);

  const rules = [
    { label: 'At least 8 characters',         met: form.newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)',     met: /[A-Z]/.test(form.newPassword) },
    { label: 'One number (0-9)',               met: /[0-9]/.test(form.newPassword) },
    { label: 'One special character',          met: /[!@#$%^&*()_+={}|:;<>,./? -]/.test(form.newPassword) },
  ];

  const allRulesMet   = rules.every((r) => r.met);
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword !== '';

  const strengthScore = rules.filter((r) => r.met).length;
  const strengthLabel = strengthScore === 0 ? '' : strengthScore === 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong';
  const strengthColor = strengthScore <= 1 ? 'bg-destructive' : strengthScore === 2 ? 'bg-yellow-500' : strengthScore === 3 ? 'bg-primary' : 'bg-green-500';
  const strengthText  = strengthScore <= 1 ? 'text-destructive' : strengthScore === 2 ? 'text-yellow-500' : strengthScore === 3 ? 'text-primary' : 'text-green-500';

  const handleSave = async () => {
    if (!allRulesMet) { toast.error('New password does not meet all requirements.'); return; }
    if (!passwordsMatch) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`${API}/api/profile/change-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-6 max-w-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display text-foreground">Change Password</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Keep your account secure with a strong password.</p>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-500">Password updated successfully!</p>
        </div>
      )}

      {/* Current password */}
      <PasswordField
        id="cur" label="Current Password"
        value={form.currentPassword} show={showCur}
        onToggle={() => setShowCur(!showCur)}
        onChange={(v) => setForm({ ...form, currentPassword: v })}
      />

      <div className="border-t border-border" />

      {/* New password */}
      <PasswordField
        id="new" label="New Password"
        value={form.newPassword} show={showNew}
        onToggle={() => setShowNew(!showNew)}
        onChange={(v) => { setForm({ ...form, newPassword: v }); setSuccess(false); }}
      />

      {/* Strength bar */}
      {form.newPassword.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  n <= strengthScore ? strengthColor : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-semibold ${strengthText}`}>{strengthLabel}</p>
        </div>
      )}

      {/* Requirements checklist */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Requirements</p>
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              rule.met ? 'bg-green-500' : 'bg-muted border border-border'
            }`}>
              {rule.met && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={`text-xs transition-colors ${rule.met ? 'text-foreground' : 'text-muted-foreground'}`}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>

      {/* Confirm password */}
      <PasswordField
        id="con" label="Confirm New Password"
        value={form.confirmPassword} show={showCon}
        onToggle={() => setShowCon(!showCon)}
        onChange={(v) => setForm({ ...form, confirmPassword: v })}
      />

      {/* Match indicator */}
      {form.confirmPassword.length > 0 && (
        <div className={`flex items-center gap-2 text-xs font-medium ${passwordsMatch ? 'text-green-500' : 'text-destructive'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${passwordsMatch ? 'bg-green-500' : 'bg-destructive'}`}>
            {passwordsMatch ? (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
        </div>
      )}

      <Button
        onClick={handleSave}
        className="w-full bg-gradient-orange text-primary-foreground hover:opacity-90"
        disabled={saving || !form.currentPassword || !allRulesMet || !passwordsMatch}
      >
        {saving
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</>
          : <><Lock className="w-4 h-4 mr-2" />Update Password</>
        }
      </Button>
    </div>
  );
};

export default RecruiterSettings;