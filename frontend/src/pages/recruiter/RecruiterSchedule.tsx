import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar, Clock, User, Video, Plus, X, Loader2,
  CheckCircle, AlertCircle, Pencil, Trash2, Link,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Applicant { _id: string; name: string; email: string; }
interface Interview {
  _id: string; applicant: string; position: string; company: string;
  recruiterName: string; date: string; time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string; meetingLink: string;
  applicantName?: string;
}

const EMPTY_FORM = {
  applicantId: '', position: '', company: '',
  date: '', time: '', meetingLink: '', notes: '',
};

const token = () => localStorage.getItem('auth_token');

const RecruiterSchedule = () => {
  const [interviews,  setInterviews]  = useState<Interview[]>([]);
  const [applicants,  setApplicants]  = useState<Applicant[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([fetchInterviews(), fetchApplicants()]);
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/interviews', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();

      // Attach applicant names from the applicants list (populated later)
      setInterviews(data);
    } catch {
      toast.error('Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/users/applicants', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setApplicants(data);
    } catch {
      toast.error('Failed to load applicants list.');
    }
  };

  // ── Create interview ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.applicantId || !form.position || !form.company || !form.date || !form.time) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/interviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          applicantId: form.applicantId,
          position:    form.position,
          company:     form.company,
          date:        form.date
            ? new Date(form.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '',
          time:        form.time
            ? new Date(`1970-01-01T${form.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '',
          meetingLink: form.meetingLink,
          notes:       form.notes,
        }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const created = await res.json();

      // Attach the applicant name for display
      const applicant = applicants.find((a) => a._id === form.applicantId);
      setInterviews((prev) => [{ ...created, applicantName: applicant?.name }, ...prev]);

      toast.success(`Interview scheduled! Notification sent to ${applicant?.name}.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update meeting link / notes ─────────────────────────────────────────────
  const handleUpdate = async (id: string, updates: Partial<Interview>) => {
    try {
      const res = await fetch(`http://localhost:5000/api/interviews/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setInterviews((prev) =>
        prev.map((iv) => (iv._id === id ? { ...iv, ...updated } : iv))
      );
      toast.success('Interview updated. Applicant notified.');
      setEditId(null);
    } catch {
      toast.error('Failed to update interview.');
    }
  };

  // ── Mark complete ───────────────────────────────────────────────────────────
  const handleComplete = (id: string) => handleUpdate(id, { status: 'completed' } as any);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this interview? The applicant will be notified.')) return;
    try {
      await fetch(`http://localhost:5000/api/interviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setInterviews((prev) => prev.filter((iv) => iv._id !== id));
      toast.success('Interview deleted.');
    } catch {
      toast.error('Failed to delete interview.');
    }
  };

  const scheduled = interviews.filter((iv) => iv.status === 'scheduled');
  const completed = interviews.filter((iv) => iv.status === 'completed');

  const applicantName = (id: string) =>
    applicants.find((a) => a._id === id)?.name || 'Unknown';

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground">Schedule</h1>
          <Button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}>
            <Plus className="w-4 h-4 mr-2" /> Schedule Interview
          </Button>
        </div>

        {/* ── Create form modal ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-lg font-bold font-display text-foreground">
                    Schedule New Interview
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Applicant select */}
                  <div className="space-y-1.5">
                    <Label>Applicant <span className="text-destructive">*</span></Label>
                    <select
                      value={form.applicantId}
                      onChange={(e) => setForm({ ...form, applicantId: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select applicant…</option>
                      {applicants.map((a) => (
                        <option key={a._id} value={a._id}>{a.name} — {a.email}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <Label>Position <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Frontend Developer"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-1.5">
                    <Label>Company <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Acme Corp"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>

                  {/* Date + Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time <span className="text-destructive">*</span></Label>
                      <Input
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Meeting link */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-primary" />
                      Meeting Link
                      <span className="text-muted-foreground font-normal">(Zoom / Meet / Teams)</span>
                    </Label>
                    <Input
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={form.meetingLink}
                      onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      This link will be sent to the applicant in their notification and shown on their interview page.
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label>Notes for applicant</Label>
                    <Textarea
                      placeholder="Any instructions, preparation tips, or info for the applicant…"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1"
                      onClick={handleCreate}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                      )}
                      {submitting ? 'Scheduling…' : 'Schedule & Notify Applicant'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {/* Upcoming */}
        {!loading && (
          <>
            <section className="mb-10">
              <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-xs font-bold px-2 py-0.5">
                  {scheduled.length}
                </span>
              </h2>

              {scheduled.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming interviews scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {scheduled.map((iv, i) => (
                    <InterviewCard
                      key={iv._id}
                      interview={iv}
                      applicantName={iv.applicantName || applicantName(iv.applicant)}
                      index={i}
                      editId={editId}
                      setEditId={setEditId}
                      onUpdate={handleUpdate}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed ({completed.length})
                </h2>
                <div className="space-y-3">
                  {completed.map((iv) => (
                    <div
                      key={iv._id}
                      className="rounded-xl border border-border bg-muted/20 p-5 flex items-center justify-between opacity-60"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{iv.position}</p>
                        <p className="text-sm text-muted-foreground">
                          {iv.applicantName || applicantName(iv.applicant)} · {iv.company}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {iv.date} at {iv.time}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-500/10 text-green-500 text-xs font-medium px-3 py-1">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </motion.div>
    </DashboardLayout>
  );
};

// ── Interview card with inline link editor ────────────────────────────────────
const InterviewCard = ({
  interview, applicantName, index, editId, setEditId, onUpdate, onComplete, onDelete,
}: {
  interview: Interview;
  applicantName: string;
  index: number;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onUpdate: (id: string, updates: any) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [linkDraft, setLinkDraft] = useState(interview.meetingLink || '');
  const isEditing = editId === interview._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-border bg-card p-5 shadow-card"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground">{interview.position}</h3>
          <p className="text-muted-foreground text-sm">{interview.company}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{applicantName}</p>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div className="flex items-center justify-end gap-1.5 text-primary text-sm font-medium">
            <Calendar className="w-4 h-4" /> {interview.date}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" /> {interview.time}
          </div>
        </div>
      </div>

      {/* Meeting link section */}
      <div className="mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="flex-1 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => onUpdate(interview._id, { meetingLink: linkDraft })}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : interview.meetingLink ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm text-foreground truncate">{interview.meetingLink}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Link className="w-3.5 h-3.5" />
                </Button>
              </a>
              <Button
                size="sm" variant="ghost" className="h-7 px-2"
                onClick={() => { setLinkDraft(interview.meetingLink); setEditId(interview._id); }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setLinkDraft(''); setEditId(interview._id); }}
            className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Video className="w-4 h-4" />
            Add meeting link (will notify applicant)
          </button>
        )}
      </div>

      {/* Notes */}
      {interview.notes && (
        <div className="mb-4 rounded-lg bg-muted/40 border border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-foreground">{interview.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm" variant="outline"
          onClick={() => onComplete(interview._id)}
          className="text-green-600 border-green-500/30 hover:bg-green-500/10"
        >
          <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Complete
        </Button>
        <Button
          size="sm" variant="outline"
          onClick={() => onDelete(interview._id)}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Delete
        </Button>
      </div>
    </motion.div>
  );
};

export default RecruiterSchedule;