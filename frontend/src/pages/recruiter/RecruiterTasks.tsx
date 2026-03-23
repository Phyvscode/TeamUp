import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus, Link2, Trash2, ClipboardList, Star, ChevronDown, ChevronUp,
  Zap, Target, Flame, ExternalLink, CheckCircle, Clock, X, Loader2,
  Award, MessageSquare, Eye, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('auth_token');
const auth = () => ({ Authorization: `Bearer ${token()}` });

// ── Types ────────────────────────────────────────────────────────
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
  applicant: { _id: string; name: string; email: string };
  applicantName: string;
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
  easy:   { Icon: Zap,    label: 'Easy',   color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  medium: { Icon: Target, label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  hard:   { Icon: Flame,  label: 'Hard',   color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

// ── Create Task Modal ──────────────────────────────────────────────
const CreateTaskModal = ({ onClose, onCreate }: { onClose: () => void; onCreate: (task: Task) => void }) => {
  const [form, setForm] = useState({
    title: '', description: '', link: '', difficulty: 'easy' as Task['difficulty'],
    maxScore: 100, dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assignedTo: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');
      onCreate(data);
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
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold font-display text-foreground">New Task</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" placeholder="e.g. Build a REST API" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <textarea
              id="desc"
              rows={3}
              placeholder="What should the applicant do?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link">Resource Link <span className="text-xs text-muted-foreground">(Google Form, PDF, Doc, etc.)</span></Label>
            <Input id="link" type="url" placeholder="https://docs.google.com/forms/..." value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))} required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as const).map(d => {
              const cfg = diffConfig[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    form.difficulty === d
                      ? `${cfg.border} ${cfg.bg} ring-1 ring-offset-0`
                      : 'border-border bg-muted/30 hover:border-border/80'
                  }`}
                >
                  <cfg.Icon className={`w-5 h-5 ${form.difficulty === d ? cfg.color : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-semibold ${form.difficulty === d ? cfg.color : 'text-muted-foreground'}`}>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxScore">Max Score</Label>
              <Input id="maxScore" type="number" min={1} max={1000} value={form.maxScore}
                onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input id="dueDate" type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-gradient-orange text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Grade Modal ───────────────────────────────────────────────────
const GradeModal = ({
  submission, maxScore, onClose, onGraded,
}: {
  submission: Submission; maxScore: number; onClose: () => void; onGraded: (s: Submission) => void;
}) => {
  const [score, setScore] = useState<number>(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tasks/submissions/${submission._id}/grade`, {
        method: 'PATCH',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to grade');
      onGraded(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.round((score / maxScore) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-display text-foreground">Grade Submission</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGrade} className="p-6 space-y-4">
          {/* Applicant + submission info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">{submission.applicantName}</p>
            <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline break-all">
              <Link2 className="w-3 h-3 shrink-0" />
              {submission.submissionLink}
            </a>
            {submission.note && <p className="text-xs text-muted-foreground italic">"{submission.note}"</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Score slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Score</Label>
              <span className="text-sm font-bold text-primary">{score} / {maxScore} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
            </div>
            <input
              type="range" min={0} max={maxScore} value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span><span>{maxScore}</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-1.5">
            <Label>Feedback <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <textarea
              rows={3}
              placeholder="Great work! Consider improving..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-gradient-orange text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
              {loading ? 'Saving...' : 'Submit Grade'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Task Card (with expandable submissions) ────────────────────────
const TaskCard = ({ task, allSubmissions, onDelete, onGrade }: {
  task: Task;
  allSubmissions: Submission[];
  onDelete: (id: string) => void;
  onGrade: (sub: Submission, maxScore: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = diffConfig[task.difficulty];
  const subs = allSubmissions.filter(s => s.task?._id === task._id);
  const gradedCount = subs.filter(s => s.status === 'graded').length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl border ${cfg.border} bg-card shadow-card overflow-hidden`}
    >
      {/* Card header */}
      <div className={`${cfg.bg} px-5 py-2.5 flex items-center gap-2`}>
        <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
        {task.dueDate && (
          <span className="ml-auto text-xs text-muted-foreground">
            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-foreground font-display">{task.title}</h3>
            {task.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{task.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{task.maxScore} pts</span>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resource link */}
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors mb-4"
        >
          <Link2 className="w-3.5 h-3.5" />
          View Task Resource
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Submissions toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            {subs.length} Submission{subs.length !== 1 ? 's' : ''}
            {gradedCount > 0 && (
              <span className="text-xs text-green-500">({gradedCount} graded)</span>
            )}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                {subs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
                )}
                {subs.map(sub => (
                  <div key={sub._id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{sub.applicantName}</p>
                        <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 break-all">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {sub.submissionLink}
                        </a>
                        {sub.note && <p className="text-xs text-muted-foreground mt-1 italic">"{sub.note}"</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {sub.status === 'graded' ? (
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-500">{sub.score}/{task.maxScore}</span>
                            <p className="text-xs text-muted-foreground">{Math.round((sub.score! / task.maxScore) * 100)}%</p>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs gap-1"
                            onClick={() => onGrade(sub, task.maxScore)}>
                            <Star className="w-3 h-3" />
                            Grade
                          </Button>
                        )}
                      </div>
                    </div>
                    {sub.feedback && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">
                        <MessageSquare className="w-3 h-3 inline mr-1 opacity-60" />
                        {sub.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const RecruiterTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [gradeTarget, setGradeTarget] = useState<{ sub: Submission; maxScore: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`${API}/api/tasks`, { headers: auth() }),
        fetch(`${API}/api/tasks/submissions/all`, { headers: auth() }),
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task and all its submissions?')) return;
    try {
      await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE', headers: auth() });
      setTasks(prev => prev.filter(t => t._id !== id));
      setSubmissions(prev => prev.filter(s => s.task?._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGraded = (updated: Submission) => {
    setSubmissions(prev => prev.map(s => s._id === updated._id ? updated : s));
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.difficulty === filter);
  const totalSubs = submissions.length;
  const gradedSubs = submissions.filter(s => s.status === 'graded').length;
  const pendingSubs = totalSubs - gradedSubs;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
              <ClipboardList className="w-7 h-7 text-primary" />
              Tasks
            </h1>
            <p className="text-muted-foreground mt-1">Assign projects to applicants and review their submissions</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-orange text-primary-foreground hover:opacity-90 gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tasks Created', value: tasks.length, icon: ClipboardList, color: 'text-primary' },
            { label: 'Total Submissions', value: totalSubs, icon: Eye, color: 'text-primary' },
            { label: 'Pending Review', value: pendingSubs, icon: Clock, color: 'text-yellow-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-4 shadow-card">
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'easy', 'medium', 'hard'] as const).map(d => {
            const active = filter === d;
            const cfg = d !== 'all' ? diffConfig[d] : null;
            return (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all border ${
                  active
                    ? (cfg ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-primary/10 border-primary/30 text-primary')
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80'
                }`}
              >
                {cfg && <cfg.Icon className="w-3.5 h-3.5" />}
                {d === 'all' ? 'All' : diffConfig[d].label}
                <span className="ml-1 rounded-full bg-black/10 dark:bg-white/10 text-xs px-1.5">
                  {d === 'all' ? tasks.length : tasks.filter(t => t.difficulty === d).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
            <ClipboardList className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="font-medium text-foreground">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "New Task" to assign a project to applicants.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  allSubmissions={submissions}
                  onDelete={handleDelete}
                  onGrade={(sub, maxScore) => setGradeTarget({ sub, maxScore })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            onClose={() => setShowCreate(false)}
            onCreate={task => setTasks(prev => [task, ...prev])}
          />
        )}
        {gradeTarget && (
          <GradeModal
            submission={gradeTarget.sub}
            maxScore={gradeTarget.maxScore}
            onClose={() => setGradeTarget(null)}
            onGraded={handleGraded}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default RecruiterTasks;