import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Save,
  Upload,
  FileText,
  ExternalLink,
  Trash2,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Link2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

const ApplicantProfile = () => {
  const { user, updateProfile } = useAppStore();

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [name,     setName]     = useState(user?.name     || '');
  const [email,    setEmail]    = useState(user?.email    || '');
  const [phone,    setPhone]    = useState(user?.phone    || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio,      setBio]      = useState(user?.bio      || '');
  const [skills,      setSkills]      = useState(user?.skills?.join(', ') || '');
  const [linkedinUrl, setLinkedinUrl] = useState((user as any)?.linkedinUrl || '');

  // ── Loading states ──────────────────────────────────────────────────────────
  const [savingProfile,   setSavingProfile]   = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // ── File input refs — triggered programmatically ────────────────────────────
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // ── Project form ────────────────────────────────────────────────────────────
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', description: '', techStack: '', link: '',
  });

  // ── Save profile ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name, email, phone, location, bio,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          linkedinUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      const updatedUser = await res.json();
      updateProfile(updatedUser);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('http://localhost:5000/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateProfile(data);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset so same file can be picked again
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── Resume upload ─────────────────────────────────────────────────────────
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF on client side before uploading
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted for resumes.');
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume must be smaller than 10 MB.');
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('http://localhost:5000/api/profile/resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const data = await res.json();
      updateProfile(data);
      toast.success('Resume uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  // ── Add project ───────────────────────────────────────────────────────────
  const handleAddProject = () => {
    if (!newProject.title.trim()) return;

    const project = {
      id: crypto.randomUUID(),
      title:       newProject.title,
      description: newProject.description,
      techStack:   newProject.techStack.split(',').map((s) => s.trim()).filter(Boolean),
      link:        newProject.link,
    };

    updateProfile({ projects: [...(user?.projects || []), project] });
    setNewProject({ title: '', description: '', techStack: '', link: '' });
    setShowProjectForm(false);
    toast.success('Project added');
  };

  // ── Get filename from stored path ─────────────────────────────────────────
  const resumeFileName = user?.resumeUrl
    ? user.resumeUrl.split('/').pop()
    : null;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
      >
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">
          My Profile
        </h1>

        {/* ── Avatar ────────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
              {user?.avatar ? (
                <img
                  src={`http://localhost:5000${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {user?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>

            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Profile Photo</p>
            <p className="text-xs text-muted-foreground mb-3">JPEG, PNG or WebP · max 5 MB</p>

            {/* Hidden file input, triggered by the button below */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
            </Button>
          </div>
        </div>

        {/* ── Profile Form ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4 mb-6">
          <h2 className="text-lg font-bold font-display text-foreground">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell recruiters a bit about yourself…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Skills <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" />
          </div>

          <Button onClick={handleSave} disabled={savingProfile}>
            {savingProfile ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>

        {/* ── Resume ────────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-1">
            Resume
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Upload a PDF resume · max 10 MB
          </p>

          {/* Hidden file input — triggered by button onClick */}
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleResumeUpload}
            className="hidden"
          />

          {/* If resume already uploaded — show it */}
          {user?.resumeUrl ? (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {resumeFileName}
                </p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3" /> Uploaded
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`http://localhost:5000${user.resumeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    View
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            /* Drop-zone style placeholder when no resume yet */
            <div
              onClick={() => !uploadingResume && resumeInputRef.current?.click()}
              className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors mb-4 ${
                uploadingResume
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {uploadingResume ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground mb-3" />
              )}
              <p className="text-sm font-medium text-foreground">
                {uploadingResume ? 'Uploading your resume…' : 'Click to upload your resume'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF only · max 10 MB</p>
            </div>
          )}

          {/* Upload / Replace button */}
          <Button
            variant={user?.resumeUrl ? 'outline' : 'default'}
            disabled={uploadingResume}
            onClick={() => resumeInputRef.current?.click()}
          >
            {uploadingResume ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploadingResume
              ? 'Uploading…'
              : user?.resumeUrl
              ? 'Replace Resume'
              : 'Upload Resume'}
          </Button>
        </div>

        {/* ── LinkedIn ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground">LinkedIn</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Add your LinkedIn profile so recruiters can learn more about you</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://linkedin.com/in/your-profile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </button>
              </a>
            )}
          </div>

          {linkedinUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0A66C2]/20 bg-[#0A66C2]/5 px-3 py-2">
              <CheckCircle className="w-4 h-4 text-[#0A66C2] shrink-0" />
              <p className="text-xs text-[#0A66C2] font-medium truncate">{linkedinUrl}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            Click <span className="font-medium text-foreground">Save Profile</span> above to save your LinkedIn link.
          </p>
        </div>

        {/* ── Projects ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold font-display text-foreground">Projects</h2>
            <Button size="sm" variant="outline" onClick={() => setShowProjectForm(!showProjectForm)}>
              {showProjectForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {showProjectForm ? 'Cancel' : 'Add Project'}
            </Button>
          </div>

          {showProjectForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mb-5"
            >
              <Input
                placeholder="Project title *"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                rows={2}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <Input
                placeholder="Tech stack (comma-separated)"
                value={newProject.techStack}
                onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
              />
              <Input
                placeholder="Live link (optional)"
                value={newProject.link}
                onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
              />
              <Button size="sm" onClick={handleAddProject} disabled={!newProject.title.trim()}>
                <Plus className="w-4 h-4 mr-1" /> Add Project
              </Button>
            </motion.div>
          )}

          <div className="space-y-3">
            {(user?.projects || []).map((project: any) => (
              <div
                key={project.id || project._id}
                className="rounded-lg border border-border bg-muted/30 p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{project.title}</p>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {project.techStack?.map((t: string) => (
                      <span key={t} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 shrink-0 mt-0.5">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}

            {(!user?.projects || user.projects.length === 0) && !showProjectForm && (
              <p className="text-sm text-muted-foreground">No projects added yet.</p>
            )}
          </div>
        </div>
        {/* ── Change Password ───────────────────────────────────────────── */}
        <ChangePasswordSection />

      </motion.div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   PasswordField — defined OUTSIDE to prevent remount on every keystroke
══════════════════════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════════════════════
   ChangePasswordSection
══════════════════════════════════════════════════════════════════════════════ */
const ChangePasswordSection = () => {
  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving,  setSaving]  = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [success, setSuccess] = useState(false);

  const rules = [
    { label: 'At least 8 characters',        met: form.newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)',    met: /[A-Z]/.test(form.newPassword) },
    { label: 'One number (0-9)',              met: /[0-9]/.test(form.newPassword) },
    { label: 'One special character',         met: /[!@#$%^&*()\-_=+[\]{};':",.<>/?@]/.test(form.newPassword) },
  ];

  const allRulesMet    = rules.every((r) => r.met);
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword !== '';
  const strengthScore  = rules.filter((r) => r.met).length;
  const strengthLabel  = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor  = strengthScore <= 1 ? 'bg-destructive' : strengthScore === 2 ? 'bg-yellow-500' : strengthScore === 3 ? 'bg-primary' : 'bg-green-500';
  const strengthText   = strengthScore <= 1 ? 'text-destructive' : strengthScore === 2 ? 'text-yellow-500' : strengthScore === 3 ? 'text-primary' : 'text-green-500';

  const handleSave = async () => {
    if (!allRulesMet)    { toast.error('New password does not meet all requirements.'); return; }
    if (!passwordsMatch) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:5000/api/profile/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-card mt-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
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
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-500">Password updated successfully!</p>
        </div>
      )}

      <div className="space-y-5 max-w-md">
        <PasswordField
          id="cur-app" label="Current Password"
          value={form.currentPassword} show={showCur}
          onToggle={() => setShowCur(!showCur)}
          onChange={(v) => setForm({ ...form, currentPassword: v })}
        />

        <div className="border-t border-border" />

        <PasswordField
          id="new-app" label="New Password"
          value={form.newPassword} show={showNew}
          onToggle={() => setShowNew(!showNew)}
          onChange={(v) => { setForm({ ...form, newPassword: v }); setSuccess(false); }}
        />

        {/* Strength bar */}
        {form.newPassword.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {[1,2,3,4].map((n) => (
                <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= strengthScore ? strengthColor : 'bg-muted'}`} />
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

        <PasswordField
          id="con-app" label="Confirm New Password"
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
    </div>
  );
};

export default ApplicantProfile;