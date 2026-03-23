import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users, CheckCircle, XCircle, Clock, Loader2,
  Mail, MapPin, FileText, ChevronDown, ChevronUp,
  Briefcase, Building2, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const token = () => localStorage.getItem('auth_token');
const API   = 'http://localhost:5000';

type Status = 'applied' | 'reviewing' | 'interview' | 'offered' | 'rejected';

interface Application {
  _id: string;
  applicant: string;
  applicantName: string;
  position: string;
  company: string;
  status: Status;
  createdAt: string;
  // enriched from /api/users/applicants/:id
  email?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  resumeUrl?: string;
}

const RecruiterPipeline = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [actioning,    setActioning]    = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  /* ── Fetch all applications sent to this recruiter ──────────────────────── */
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/applications`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      const apps: Application[] = await res.json();

      // Auto-move fresh "applied" → "reviewing" so dashboard shows correct count
      const toMark = apps.filter((a) => a.status === 'applied');
      const marked = await Promise.all(
        toMark.map((a) => updateStatus(a._id, 'reviewing', false))
      );

      const updated = apps.map((a) => {
        const m = marked.find((u) => u && u._id === a._id);
        return m || a;
      });

      setApplications(updated);
    } catch {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  /* ── PATCH status ───────────────────────────────────────────────────────── */
  const updateStatus = async (
    id: string,
    status: Status,
    notify = true
  ): Promise<Application | null> => {
    try {
      const res = await fetch(`${API}/api/applications/${id}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (notify) toast.error('Failed to update status.');
      return null;
    }
  };

  /* ── Offer an applicant ─────────────────────────────────────────────────── */
  const handleOffer = async (id: string, name: string) => {
    if (!confirm(`Offer the job to ${name}? They will be notified immediately.`)) return;
    setActioning(id);
    const updated = await updateStatus(id, 'offered');
    if (updated) {
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'offered' } : a))
      );
      toast.success(`🎉 Job offer sent to ${name}!`);
    }
    setActioning(null);
  };

  /* ── Remove / reject an applicant ─────────────────────────────────────── */
  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the pipeline? They will be notified.`)) return;
    setActioning(id);
    const updated = await updateStatus(id, 'rejected');
    if (updated) {
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'rejected' } : a))
      );
      toast.success(`${name} has been removed from the pipeline.`);
    }
    setActioning(null);
  };

  /* ── Undo — move rejected back to reviewing ─────────────────────────────── */
  const handleUndo = async (id: string) => {
    setActioning(id);
    const updated = await updateStatus(id, 'reviewing');
    if (updated) {
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'reviewing' } : a))
      );
      toast.success('Application moved back to Under Review.');
    }
    setActioning(null);
  };

  /* ── Sections ───────────────────────────────────────────────────────────── */
  const pending  = applications.filter((a) => a.status === 'reviewing' || a.status === 'applied' || a.status === 'interview');
  const offered  = applications.filter((a) => a.status === 'offered');
  const rejected = applications.filter((a) => a.status === 'rejected');

  const sections = [
    {
      key:   'pending',
      label: 'Under Review',
      items: pending,
      icon:  Clock,
      color: 'text-yellow-500',
      bg:    'bg-yellow-500/10',
      badge: 'bg-yellow-500/10 text-yellow-500',
      description: 'Applicants awaiting your decision',
    },
    {
      key:   'offered',
      label: 'Offered',
      items: offered,
      icon:  CheckCircle,
      color: 'text-green-500',
      bg:    'bg-green-500/10',
      badge: 'bg-green-500/10 text-green-500',
      description: 'Applicants you have extended offers to',
    },
    {
      key:   'rejected',
      label: 'Removed',
      items: rejected,
      icon:  XCircle,
      color: 'text-destructive',
      bg:    'bg-destructive/10',
      badge: 'bg-destructive/10 text-destructive',
      description: 'Applicants removed from the pipeline',
    },
  ];

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Review applicants and make hiring decisions
          </p>
        </div>

        {/* ── Summary bar ───────────────────────────────────────────────── */}
        {!loading && applications.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {sections.map((s) => (
              <div key={s.key} className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold font-display text-foreground">{s.items.length}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────────────────── */}
        {!loading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
            <p className="text-foreground font-semibold text-lg">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Applications from applicants who selected you will appear here.
            </p>
          </div>
        )}

        {/* ── Sections ──────────────────────────────────────────────────── */}
        {!loading && applications.length > 0 && (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.key} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">

                {/* Section header */}
                <div className={`flex items-center gap-3 px-6 py-4 border-b border-border ${
                  section.items.length === 0 ? 'opacity-50' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-lg ${section.bg} flex items-center justify-center shrink-0`}>
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-foreground font-display">{section.label}</h2>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${section.badge}`}>
                    {section.items.length}
                  </span>
                </div>

                {/* No items in section */}
                {section.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    None yet.
                  </p>
                )}

                {/* Applicant rows */}
                <div className="divide-y divide-border">
                  {section.items.map((app, i) => (
                    <ApplicantRow
                      key={app._id}
                      app={app}
                      index={i}
                      section={section.key}
                      isExpanded={expanded === app._id}
                      isActioning={actioning === app._id}
                      onExpand={() => setExpanded(expanded === app._id ? null : app._id)}
                      onOffer={() => handleOffer(app._id, app.applicantName)}
                      onRemove={() => handleRemove(app._id, app.applicantName)}
                      onUndo={() => handleUndo(app._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

/* ── Applicant row component ──────────────────────────────────────────────── */
const ApplicantRow = ({
  app, index, section, isExpanded, isActioning,
  onExpand, onOffer, onRemove, onUndo,
}: {
  app: Application;
  index: number;
  section: string;
  isExpanded: boolean;
  isActioning: boolean;
  onExpand: () => void;
  onOffer: () => void;
  onRemove: () => void;
  onUndo: () => void;
}) => {
  const [profile, setProfile]   = useState<Partial<Application> | null>(null);
  const [fetching, setFetching] = useState(false);

  // Fetch full profile when row is expanded
  useEffect(() => {
    if (isExpanded && !profile) {
      setFetching(true);
      fetch(`${API}/api/users/applicants/${app.applicant}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setProfile(d); })
        .finally(() => setFetching(false));
    }
  }, [isExpanded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      {/* ── Main row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {profile?.avatar
            ? <img src={`${API}${profile.avatar}`} alt={app.applicantName} className="w-full h-full object-cover" />
            : <span className="text-primary font-bold">{app.applicantName?.charAt(0)?.toUpperCase() || '?'}</span>
          }
        </div>

        {/* Name + position */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{app.applicantName}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="w-3 h-3" />{app.position}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />{app.company}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
              <Calendar className="w-3 h-3" />
              {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {section === 'pending' && (
            <>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs"
                onClick={onOffer}
                disabled={isActioning}
              >
                {isActioning
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><CheckCircle className="w-3.5 h-3.5 mr-1" />Offer Job</>
                }
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                onClick={onRemove}
                disabled={isActioning}
              >
                {isActioning
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><XCircle className="w-3.5 h-3.5 mr-1" />Remove</>
                }
              </Button>
            </>
          )}

          {section === 'offered' && (
            <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Offer Extended
            </span>
          )}

          {section === 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={onUndo}
              disabled={isActioning}
            >
              {isActioning
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : 'Move to Review'
              }
            </Button>
          )}

          {/* Expand toggle */}
          <button
            onClick={onExpand}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Expanded profile panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-1 bg-muted/20 border-t border-border">

              {fetching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}

              {!fetching && profile && (
                <div className="space-y-4 pt-3">
                  {/* Contact */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {profile.email && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />{profile.email}
                      </span>
                    )}
                    {profile.location && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />{profile.location}
                      </span>
                    )}
                    {profile.resumeUrl && (
                      <a
                        href={`${API}${profile.resumeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />View Resume
                      </a>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* No profile info */}
                  {!profile.bio && (!profile.skills || profile.skills.length === 0) && !profile.resumeUrl && (
                    <p className="text-sm text-muted-foreground italic">This applicant hasn't filled their profile yet.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecruiterPipeline;