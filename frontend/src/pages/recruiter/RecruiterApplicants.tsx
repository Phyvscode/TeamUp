import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Mail, Search, Users, Loader2, MessageSquare,
  X, MapPin, Phone, Calendar, ChevronRight,
  Briefcase, Code, User, FileText, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  link: string;
}

interface Applicant {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  resumeUrl?: string;
  projects?: Project[];
  createdAt: string;
}

const token = () => localStorage.getItem('auth_token');
const API   = 'http://localhost:5000';

const RecruiterApplicants = () => {
  const [applicants,     setApplicants]     = useState<Applicant[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState<Applicant | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchApplicants(); }, []);

  /* ── fetch all applicants ─────────────────────────────────────────────── */
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/applicants`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setApplicants(await res.json());
    } catch {
      toast.error('Failed to load applicants. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  /* ── open full profile modal ──────────────────────────────────────────── */
  const openProfile = async (applicant: Applicant) => {
    setSelected(applicant);        // show immediately with card data
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API}/api/users/applicants/${applicant._id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setSelected(await res.json());
    } catch { /* keep list data */ }
    finally { setLoadingProfile(false); }
  };

  /* ── start conversation then navigate to messages ─────────────────────── */
  const handleMessage = async (applicantId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`${API}/api/users/start-conversation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ targetUserId: applicantId }),
      });
      if (!res.ok) throw new Error();
      navigate('/recruiter/messages');
    } catch {
      toast.error('Could not open conversation.');
    }
  };

  /* ── client-side search ───────────────────────────────────────────────── */
  const filtered = applicants.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q)                    ||
      a.email.toLowerCase().includes(q)                   ||
      (a.skills  || []).some((s) => s.toLowerCase().includes(q)) ||
      (a.location || '').toLowerCase().includes(q)        ||
      (a.bio      || '').toLowerCase().includes(q)
    );
  });

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Applicants</h1>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-1">
                {applicants.length} registered applicant{applicants.length !== 1 ? 's' : ''}
                {search && filtered.length !== applicants.length && ` · ${filtered.length} shown`}
              </p>
            )}
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skill, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* ── States ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {!loading && applicants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-14 h-14 text-muted-foreground opacity-20 mb-4" />
            <p className="text-foreground font-semibold text-lg">No applicants yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              New applicants appear here as soon as they sign up.
            </p>
          </div>
        )}

        {!loading && applicants.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
            <p className="text-foreground font-semibold">No results for "{search}"</p>
            <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* ── Applicant card grid ────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((applicant, i) => (
              <motion.div
                key={applicant._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openProfile(applicant)}
                className="group rounded-xl border border-border bg-card p-5 shadow-card cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
              >
                {/* Avatar + basic info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {applicant.avatar
                      ? <img src={`${API}${applicant.avatar}`} alt={applicant.name} className="w-full h-full object-cover" />
                      : <span className="text-primary font-bold text-lg">{applicant.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{applicant.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />{applicant.email}
                    </p>
                    {applicant.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />{applicant.location}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>

                {/* Bio snippet */}
                {applicant.bio && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {applicant.bio}
                  </p>
                )}

                {/* Skills pills */}
                {applicant.skills && applicant.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {applicant.skills.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{s}</span>
                    ))}
                    {applicant.skills.length > 4 && (
                      <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs">
                        +{applicant.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border mt-auto">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 text-xs h-8 mt-3"
                    onClick={(e) => handleMessage(applicant._id, e)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message
                  </Button>
                  {applicant.resumeUrl && (
                    <a
                      href={`${API}${applicant.resumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3"
                    >
                      <Button size="sm" variant="outline" className="h-8 px-3">
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Full Profile Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            >
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Loading overlay while fetching full profile */}
              {loadingProfile && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/70 rounded-2xl z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {/* ── Hero section ─────────────────────────────────────────── */}
              <div className="bg-primary/5 border-b border-border rounded-t-2xl p-6">
                <div className="flex items-start gap-5 pr-8">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/30">
                    {selected.avatar
                      ? <img src={`${API}${selected.avatar}`} alt={selected.name} className="w-full h-full object-cover" />
                      : <span className="text-primary font-bold text-3xl">{selected.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>

                  {/* Name + contact details */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold font-display text-foreground">{selected.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0" />{selected.email}
                      </span>
                      {selected.phone && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0" />{selected.phone}
                        </span>
                      )}
                      {selected.location && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />{selected.location}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Joined {new Date(selected.createdAt).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-5">
                  <Button
                    className="flex-1"
                    onClick={() => { handleMessage(selected._id); setSelected(null); }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Send Message
                  </Button>
                  {selected.resumeUrl ? (
                    <a href={`${API}${selected.resumeUrl}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" /> View Resume
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" disabled className="opacity-40 cursor-not-allowed">
                      <FileText className="w-4 h-4 mr-2" /> No Resume
                    </Button>
                  )}
                </div>
              </div>

              {/* ── Profile body ──────────────────────────────────────────── */}
              <div className="p-6 space-y-7">

                {/* About / Bio */}
                <section>
                  <SectionTitle icon={User} label="About" />
                  {selected.bio
                    ? <p className="text-sm text-muted-foreground leading-relaxed">{selected.bio}</p>
                    : <p className="text-sm text-muted-foreground italic">No bio added yet.</p>
                  }
                </section>

                {/* Skills */}
                {selected.skills && selected.skills.length > 0 && (
                  <section>
                    <SectionTitle icon={Code} label={`Skills (${selected.skills.length})`} />
                    <div className="flex flex-wrap gap-2">
                      {selected.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Projects */}
                <section>
                  <SectionTitle
                    icon={Briefcase}
                    label={`Projects${selected.projects?.length ? ` (${selected.projects.length})` : ''}`}
                  />
                  {selected.projects && selected.projects.length > 0 ? (
                    <div className="space-y-3">
                      {selected.projects.map((project) => (
                        <div key={project._id} className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="font-semibold text-foreground">{project.title}</h4>
                            {project.link && project.link !== '#' && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/70 shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                          )}
                          {project.techStack?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {project.techStack.map((t) => (
                                <span key={t} className="text-xs bg-muted border border-border text-muted-foreground rounded-md px-2 py-0.5">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No projects added yet.</p>
                  )}
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{label}</h3>
  </div>
);

export default RecruiterApplicants;