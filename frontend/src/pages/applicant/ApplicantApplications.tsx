import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Briefcase, Plus, X, Loader2, Trash2,
  Building2, Calendar, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Status = "applied" | "reviewing" | "interview" | "offered" | "rejected";

interface Application {
  _id: string;
  position: string;
  company: string;
  status: Status;
  createdAt: string;
}

interface Recruiter {
  _id: string;
  name: string;
  company: string;
}

const token = () => localStorage.getItem("auth_token");
const API   = "http://localhost:5000";

const statusStyles: Record<Status, string> = {
  applied:   "bg-muted text-muted-foreground",
  reviewing: "bg-yellow-500/10 text-yellow-500",
  interview: "bg-primary/10 text-primary",
  offered:   "bg-green-500/10 text-green-500",
  rejected:  "bg-destructive/10 text-destructive",
};

const statusLabel: Record<Status, string> = {
  applied:   "Applied",
  reviewing: "Reviewing",
  interview: "Interview",
  offered:   "Offered 🎉",
  rejected:  "Rejected",
};

const EMPTY_FORM = { position: "", company: "", recruiterId: "" };

const ApplicantApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [recruiters,   setRecruiters]   = useState<Recruiter[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [form,         setForm]         = useState(EMPTY_FORM);

  useEffect(() => {
    fetchApplications();
    fetchRecruiters();
  }, []);

  /* ── fetch applicant's own applications ─────────────────────────────────── */
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/applications`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setApplications(await res.json());
    } catch {
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  /* ── fetch recruiters for the optional dropdown ─────────────────────────── */
  const fetchRecruiters = async () => {
    try {
      const res = await fetch(`${API}/api/users/recruiters`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setRecruiters(await res.json());
    } catch { /* non-critical */ }
  };

  /* ── submit new application ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.position.trim() || !form.company.trim()) {
      toast.error("Position and company are required.");
      return;
    }
    setSubmitting(true);
    try {
      const body: any = {
        position: form.position.trim(),
        company:  form.company.trim(),
      };
      if (form.recruiterId) body.recruiterId = form.recruiterId;

      const res = await fetch(`${API}/api/applications`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const created = await res.json();

      setApplications((prev) => [created, ...prev]);
      toast.success("Application submitted!");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── withdraw / delete application ─────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (!confirm("Withdraw this application?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setApplications((prev) => prev.filter((a) => a._id !== id));
      toast.success("Application withdrawn.");
    } catch {
      toast.error("Failed to withdraw application.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              My Applications
            </h1>
            {!loading && applications.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {applications.length} application{applications.length !== 1 ? "s" : ""} total
              </p>
            )}
          </div>
          <Button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}>
            <Plus className="w-4 h-4 mr-2" /> Apply Now
          </Button>
        </div>

        {/* ── New Application Modal ──────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
              >
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-lg font-bold font-display text-foreground">
                    New Application
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Position <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Frontend Developer"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Company <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Acme Corp"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Notify Recruiter
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </Label>
                    <select
                      value={form.recruiterId}
                      onChange={(e) => setForm({ ...form, recruiterId: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select a recruiter to notify…</option>
                      {recruiters.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}{r.company ? ` — ${r.company}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      If selected, the recruiter will receive a notification about your application.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                      {submitting
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                        : <><Briefcase className="w-4 h-4 mr-2" /> Submit Application</>
                      }
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

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-primary opacity-60" />
            </div>
            <p className="text-foreground font-semibold text-lg">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Start applying for jobs and track your progress here.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Apply Now
            </Button>
          </div>
        )}

        {/* ── Applications table ─────────────────────────────────────────── */}
        {!loading && applications.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Position
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Company
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                    Applied
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {applications.map((app, i) => (
                  <motion.tr
                    key={app._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Position */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{app.position}</span>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        {app.company}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {formatDate(app.createdAt)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[app.status]}`}>
                        {statusLabel[app.status]}
                      </span>
                    </td>

                    {/* Withdraw */}
                    <td className="px-6 py-4 text-right">
                      {app.status === "applied" || app.status === "reviewing" ? (
                        <button
                          onClick={() => handleDelete(app._id)}
                          disabled={deletingId === app._id}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                          title="Withdraw application"
                        >
                          {deletingId === app._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      ) : (
                        <span className="w-4 h-4 block" /> /* spacer */
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </motion.div>
    </DashboardLayout>
  );
};

export default ApplicantApplications;