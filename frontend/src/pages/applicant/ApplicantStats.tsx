import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, Briefcase, Calendar, CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';

const ApplicantStats = () => {
  const { applications, interviews } = useAppStore();

  const statusCounts = {
    applied: applications.filter((a) => a.status === 'applied').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const totalApps = applications.length;
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled').length;
  const successRate = totalApps > 0 ? Math.round(((statusCounts.offered + statusCounts.interview) / totalApps) * 100) : 0;

  const stats = [
    { label: 'Total Applications', value: totalApps, icon: Briefcase, color: 'text-primary' },
    { label: 'Interviews Scheduled', value: scheduledInterviews, icon: Calendar, color: 'text-primary' },
    { label: 'Offers Received', value: statusCounts.offered, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  const pipeline = [
    { label: 'Applied', count: statusCounts.applied, color: 'bg-muted-foreground' },
    { label: 'Reviewing', count: statusCounts.reviewing, color: 'bg-yellow-500' },
    { label: 'Interview', count: statusCounts.interview, color: 'bg-primary' },
    { label: 'Offered', count: statusCounts.offered, color: 'bg-green-500' },
    { label: 'Rejected', count: statusCounts.rejected, color: 'bg-destructive' },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-foreground mb-8 flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" /> My Stats
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-5">Application Pipeline</h2>
          <div className="space-y-4">
            {pipeline.map((stage) => (
              <div key={stage.label} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">{stage.label}</span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totalApps > 0 ? `${(stage.count / totalApps) * 100}%` : '0%' }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-2`}
                  >
                    {stage.count > 0 && <span className="text-xs font-bold text-white">{stage.count}</span>}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold font-display text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  app.status === 'offered' ? 'bg-green-500' :
                  app.status === 'interview' ? 'bg-primary' :
                  app.status === 'reviewing' ? 'bg-yellow-500' :
                  app.status === 'rejected' ? 'bg-destructive' :
                  'bg-muted-foreground'
                }`} />
                <span className="text-foreground font-medium">{app.position}</span>
                <span className="text-muted-foreground">at {app.company}</span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">{app.status}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ApplicantStats;
