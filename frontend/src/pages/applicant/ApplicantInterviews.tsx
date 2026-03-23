import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar,
  Clock,
  User,
  Video,
  CheckCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ApplicantInterviews = () => {
  const { interviews, fetchInterviews } = useAppStore();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const scheduled  = interviews.filter((i) => i.status === 'scheduled');
  const completed  = interviews.filter((i) => i.status === 'completed');
  const cancelled  = interviews.filter((i) => i.status === 'cancelled');

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">
          My Interviews
        </h1>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {interviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
            <p className="text-foreground font-medium">No interviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Interviews scheduled by recruiters will appear here.
            </p>
          </div>
        )}

        {/* ── Upcoming ─────────────────────────────────────────────────────── */}
        {scheduled.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">
                {scheduled.length}
              </span>
            </h2>

            <div className="space-y-4">
              {scheduled.map((interview: any, i: number) => (
                <motion.div
                  key={interview._id || interview.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-primary/30 bg-card shadow-card overflow-hidden"
                >
                  {/* Confirmed banner */}
                  <div className="bg-primary/10 border-b border-primary/20 px-5 py-2.5 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Interview Confirmed — Please be ready on time
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Position + company */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold font-display text-foreground">
                        {interview.position}
                      </h3>
                      <p className="text-muted-foreground">{interview.company}</p>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                          <p className="text-sm font-semibold text-foreground">{interview.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Time</p>
                          <p className="text-sm font-semibold text-foreground">{interview.time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Recruiter</p>
                          <p className="text-sm font-semibold text-foreground">{interview.recruiterName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Meeting link */}
                    {interview.meetingLink ? (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Meeting Link Ready</p>
                            <p className="text-xs text-muted-foreground truncate">{interview.meetingLink}</p>
                          </div>
                        </div>
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button size="sm" className="gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Join
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-4">
                        <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Meeting link not added yet — your recruiter will share it before the interview.
                        </p>
                      </div>
                    )}

                    {/* Notes from recruiter */}
                    {interview.notes && (
                      <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Note from recruiter
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{interview.notes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Completed ────────────────────────────────────────────────────── */}
        {completed.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completed
              <span className="ml-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold px-2 py-0.5">
                {completed.length}
              </span>
            </h2>

            <div className="space-y-3">
              {completed.map((interview: any) => (
                <div
                  key={interview._id || interview.id}
                  className="rounded-xl border border-border bg-muted/20 p-5 flex items-center justify-between gap-4 opacity-70"
                >
                  <div>
                    <p className="font-semibold text-foreground">{interview.position}</p>
                    <p className="text-sm text-muted-foreground">{interview.company}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {interview.date} at {interview.time} · with {interview.recruiterName}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-500/10 text-green-500 text-xs font-medium px-3 py-1 shrink-0">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Cancelled ────────────────────────────────────────────────────── */}
        {cancelled.length > 0 && (
          <section>
            <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cancelled
            </h2>

            <div className="space-y-3">
              {cancelled.map((interview: any) => (
                <div
                  key={interview._id || interview.id}
                  className="rounded-xl border border-border bg-muted/10 p-5 opacity-50"
                >
                  <p className="font-medium text-foreground line-through">{interview.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {interview.company} · {interview.date}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ApplicantInterviews;