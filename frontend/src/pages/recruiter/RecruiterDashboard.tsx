import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Briefcase, Calendar, CheckCircle, Clock, Users, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('auth_token');
const API   = 'http://localhost:5000';

interface Application {
  _id: string;
  id?: string;
  applicantName: string;
  position: string;
  company: string;
  status: 'applied' | 'reviewing' | 'interview' | 'offered' | 'rejected';
  createdAt: string;
}

interface Interview {
  _id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface DashboardData {
  totalApplicants: number;
  interviewsScheduled: number;
  underReview: number;
  offersMade: number;
  recentApplications: Application[];
}

const RecruiterDashboard = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch applications and interviews in parallel
      const [appsRes, interviewsRes, applicantsRes] = await Promise.all([
        fetch(`${API}/api/applications`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch(`${API}/api/interviews`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch(`${API}/api/users/applicants`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ]);

      const apps:        Application[] = appsRes.ok        ? await appsRes.json()        : [];
      const interviews:  Interview[]   = interviewsRes.ok  ? await interviewsRes.json()  : [];
      const applicants:  any[]         = applicantsRes.ok  ? await applicantsRes.json()  : [];

      setData({
        totalApplicants:     applicants.length,
        interviewsScheduled: interviews.filter((i) => i.status === 'scheduled').length,
        underReview:         apps.filter((a) => a.status === 'reviewing').length,
        offersMade:          apps.filter((a) => a.status === 'offered').length,
        recentApplications:  apps.slice(0, 6),
      });

      setLastUpdated(new Date());
    } catch {
      // fail silently — show zeros
      setData({
        totalApplicants: 0, interviewsScheduled: 0,
        underReview: 0,     offersMade: 0,
        recentApplications: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label:  'Total Applicants',
      value:  data?.totalApplicants      ?? '—',
      icon:   Users,
      color:  'text-primary',
      bg:     'bg-primary/10',
      route:  '/recruiter/applicants',
    },
    {
      label:  'Interviews Scheduled',
      value:  data?.interviewsScheduled  ?? '—',
      icon:   Calendar,
      color:  'text-primary',
      bg:     'bg-primary/10',
      route:  '/recruiter/schedule',
    },
    {
      label:  'Under Review',
      value:  data?.underReview          ?? '—',
      icon:   Clock,
      color:  'text-yellow-500',
      bg:     'bg-yellow-500/10',
      route:  null,
    },
    {
      label:  'Offers Made',
      value:  data?.offersMade           ?? '—',
      icon:   CheckCircle,
      color:  'text-green-500',
      bg:     'bg-green-500/10',
      route:  null,
    },
  ];

  const statusStyles: Record<string, string> = {
    applied:   'bg-muted text-muted-foreground',
    reviewing: 'bg-yellow-500/10 text-yellow-500',
    interview: 'bg-primary/10 text-primary',
    offered:   'bg-green-500/10 text-green-500',
    rejected:  'bg-destructive/10 text-destructive',
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground mb-1">
              Welcome, <span className="text-gradient-orange">{user?.name}</span>
            </h1>
            <p className="text-muted-foreground">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Manage your recruitment pipeline'
              }
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 mt-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => stat.route && navigate(stat.route)}
              className={`rounded-xl border border-border bg-card p-5 shadow-card transition-all ${
                stat.route ? 'cursor-pointer hover:border-primary/40 hover:shadow-lg' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>

              {loading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              )}

              <p className="text-sm text-muted-foreground">{stat.label}</p>

              {stat.route && (
                <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100">
                  View all →
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Recent Applications ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recent Applications
            </h2>
            <button
              onClick={() => navigate('/recruiter/applicants')}
              className="text-sm text-primary hover:underline"
            >
              View all applicants →
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : data?.recentApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
              <p className="text-sm text-muted-foreground">
                No applications yet. They'll appear here when applicants sign up and apply.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentApplications.map((app, i) => (
                <motion.div
                  key={app._id || app.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar initial */}
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {app.applicantName?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {app.applicantName || 'Unknown Applicant'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.position}
                        {app.company ? ` · ${app.company}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(app.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </motion.div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;