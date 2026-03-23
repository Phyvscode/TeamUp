import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ClipboardList, Zap, Target, Flame, ExternalLink, Link2,
  CheckCircle, Clock, Send, X, Loader2, Star, Award,
  MessageSquare, Calendar, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('auth_token');
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ── Types ─────────────────────────────────────────────────────────
interface Task {
  _id: string;
  title: string;
  description: string;
  link: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxScore: number;
  dueDate?: string;
  recruiterName: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  task: { _id: string; title: string; difficulty: string; maxScore: number };
  submissionLink: string;
  note: string;
  status: 'submitted' | 'graded';
  score: number | null;
  feedback: string;
  createdAt: string;
  gradedAt?: string;
}

// ── Difficulty config ─────────────────────────────────────────────
const diffConfig = {
  easy: {
    Icon: Zap,
    label: 'Easy',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    activeBg: 'bg-green-500',
    ring: 'ring-green-500/30',
    description: 'Beginner-friendly projects to get started',
  },
  medium: {
    Icon: Target,
    label: 'Medium',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    activeBg: 'bg-yellow-500',
    ring: 'ring-yellow-500/30',
    description: 'Intermediate challenges to showcase your skills',
  },
  hard: {
    Icon: Flame,
    label: 'Hard',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    activeBg: 'bg-destructive',
    ring: 'ring-destructive/30',
    description: 'Advanced tasks for experienced professionals',
  },
};

// ── Submit Modal ──────────────────────────────────────────────────
const SubmitModal = ({
  task,
  existing,
  onClose,
  onSubmitted,
}: {
  task: Task;
  existing: Submission | undefined;
  onClose: () => void;
  onSubmitted: (sub: Submission) => void;
}) => {
  const [link, setLink] = useState(existing?.submissionLink || '');
  const [note, setNote] = useState(existing?.note || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cfg = diffConfig[task.difficulty];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tasks/${task._id}/submit`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionLink: link, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      onSubmitted(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={`${cfg.bg} ${cfg.border} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <cfg.Icon className={`w-5 h-5 ${cfg.color}`} />
              <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label} Task</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold font-display text-foreground mt-2">{task.title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {existing?.status === 'graded' && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-start gap-3">
              <Award className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-500">
                  Graded: {existing.score} / {task.maxScore}
                </p>
                {existing.feedback && (
                  <p className="text-xs text-muted-foreground mt-0.5">{existing.feedback}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">You can still resubmit to update your work.</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="subLink">
              Submission Link{' '}
              <span className="text-xs text-muted-foreground">(GitHub, deployed app, Google Drive, etc.)</span>
            </Label>
            <Input
              id="subLink"
              type="url"
              placeholder="https://github.com/yourusername/project"
              value={link}
              onChange={e => setLink(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <textarea
              id="note"
              rows={3}
              placeholder="Describe your approach, tools used, or any notes for the recruiter..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-orange text-primary-foreground hover:opacity-90"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {loading ? 'Submitting...' : existing ? 'Resubmit' : 'Submit'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Task Card ──────────────────────────────────────────────────────
const TaskCard = ({
  task,
  submission,
  index,
  onSubmitClick,
}: {
  task: Task;
  submission: Submission | undefined;
  index: number;
  onSubmitClick: (task: Task) => void;
}) => {
  const cfg = diffConfig[task.difficulty];
  const isGraded = submission?.status === 'graded';
  const isSubmitted = !!submission;
  const pct = isGraded && submission.score !== null
    ? Math.round((submission.score / task.maxScore) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl border ${cfg.border} bg-card shadow-card overflow-hidden`}
    >
      {/* Top stripe */}
      <div className={`${cfg.bg} px-5 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isGraded && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 text-green-500 text-xs font-semibold px-2.5 py-0.5">
              <Star className="w-3 h-3" />
              {submission.score}/{task.maxScore}
            </span>
          )}
          {isSubmitted && !isGraded && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5">
              <Clock className="w-3 h-3" />
              Under review
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Title + recruiter */}
        <div className="mb-3">
          <h3 className="font-bold text-foreground font-display text-lg leading-tight">{task.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">by {task.recruiterName}</p>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {task.maxScore} pts
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Resource link */}
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors mb-4 w-full"
        >
          <Link2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate flex-1">Open Task Resource</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Submission state */}
        {isGraded && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-green-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Graded — {pct}%
              </p>
              <span className="text-sm font-bold text-green-500">{submission.score}/{task.maxScore}</span>
            </div>
            {/* Score bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            {submission.feedback && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                {submission.feedback}
              </p>
            )}
          </div>
        )}

        {isSubmitted && !isGraded && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Submitted — awaiting recruiter review
            </p>
            <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 break-all">
              <ExternalLink className="w-3 h-3 shrink-0" />
              {submission.submissionLink}
            </a>
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={() => onSubmitClick(task)}
          variant={isSubmitted ? 'outline' : 'default'}
          className={`w-full gap-2 ${!isSubmitted ? 'bg-gradient-orange text-primary-foreground hover:opacity-90' : ''}`}
        >
          {isSubmitted ? (
            <>
              <Send className="w-4 h-4" />
              Resubmit
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Work
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const ApplicantTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [submitTarget, setSubmitTarget] = useState<Task | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`${API}/api/tasks`, { headers: auth() }),
        fetch(`${API}/api/tasks/my-submissions/list`, { headers: auth() }),
      ]);
      const tData = tRes.ok ? await tRes.json() : [];
      const sData = sRes.ok ? await sRes.json() : [];
      setTasks(Array.isArray(tData) ? tData : []);
      setSubmissions(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (taskId: string) =>
    submissions.find(s => (s.task as any)?._id === taskId || (s.task as any) === taskId);

  const handleSubmitted = (newSub: Submission) => {
    setSubmissions(prev => {
      const exists = prev.find(s => s._id === newSub._id);
      return exists ? prev.map(s => s._id === newSub._id ? newSub : s) : [newSub, ...prev];
    });
  };

  const tabs = (['easy', 'medium', 'hard'] as const);
  const tabTasks = tasks.filter(t => t.difficulty === activeTab);

  const completedCount = (diff: 'easy' | 'medium' | 'hard') =>
    tasks.filter(t => t.difficulty === diff && !!getSubmission(t._id)).length;

  const totalSubmitted = submissions.length;
  const totalGraded = submissions.filter(s => s.status === 'graded').length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <h1 className="text-3xl font-bold font-display text-foreground mb-1 flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-primary" />
          My Tasks
        </h1>
        <p className="text-muted-foreground mb-6">
          Complete projects assigned by recruiters and showcase your skills
        </p>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: tasks.length, icon: ClipboardList, color: 'text-primary' },
            { label: 'Submitted', value: totalSubmitted, icon: CheckCircle, color: 'text-primary' },
            { label: 'Graded', value: totalGraded, icon: Award, color: 'text-green-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-4 shadow-card">
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Difficulty Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tabs.map(diff => {
            const cfg = diffConfig[diff];
            const count = tasks.filter(t => t.difficulty === diff).length;
            const done = completedCount(diff);
            const isActive = activeTab === diff;

            return (
              <button
                key={diff}
                onClick={() => setActiveTab(diff)}
                className={`relative rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? `${cfg.border} ${cfg.bg} ring-1 ${cfg.ring}`
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <cfg.Icon className={`w-5 h-5 ${isActive ? cfg.color : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-sm ${isActive ? cfg.color : 'text-muted-foreground'}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className={`text-2xl font-bold font-display ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {done}/{count} submitted
                </p>

                {/* Progress bar */}
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.activeBg} rounded-full transition-all duration-500`}
                    style={{ width: count > 0 ? `${(done / count) * 100}%` : '0%' }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <div className={`rounded-xl border ${diffConfig[activeTab].border} ${diffConfig[activeTab].bg} px-4 py-3 mb-6 flex items-center gap-3`}>
          {(() => { const cfg = diffConfig[activeTab]; return <cfg.Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />; })()}
          <p className={`text-sm ${diffConfig[activeTab].color} font-medium`}>
            {diffConfig[activeTab].description}
          </p>
        </div>

        {/* Task grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : tabTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
            <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="font-medium text-foreground">No {activeTab} tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your recruiter hasn't assigned any {activeTab} tasks yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {tabTasks.map((task, i) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  submission={getSubmission(task._id)}
                  index={i}
                  onSubmitClick={setSubmitTarget}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {submitTarget && (
          <SubmitModal
            task={submitTarget}
            existing={getSubmission(submitTarget._id)}
            onClose={() => setSubmitTarget(null)}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ApplicantTasks;