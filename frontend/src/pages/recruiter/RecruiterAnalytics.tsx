import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, Briefcase, Calendar, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';

const RecruiterAnalytics = () => {
  const { applications, interviews } = useAppStore();

  const statusCounts = {
    applied: applications.filter((a) => a.status === 'applied').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const totalApps = applications.length;
  const hireRate = totalApps > 0 ? Math.round((statusCounts.offered / totalApps) * 100) : 0;

  const stats = [
    { label: 'Total Applicants', value: totalApps, icon: Users, color: 'text-primary' },
    { label: 'Interviews Done', value: interviews.filter((i) => i.status === 'completed').length, icon: Calendar, color: 'text-primary' },
    { label: 'Offers Extended', value: statusCounts.offered, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Hire Rate', value: `${hireRate}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  const pipeline = [
    { label: 'Applied', count: statusCounts.applied, color: 'bg-muted-foreground' },
    { label: 'Reviewing', count: statusCounts.reviewing, color: 'bg-yellow-500' },
    { label: 'Interview', count: statusCounts.interview, color: 'bg-primary' },
    { label: 'Offered', count: statusCounts.offered, color: 'bg-green-500' },
    { label: 'Rejected', count: statusCounts.rejected, color: 'bg-destructive' },
  ];

  const positionBreakdown = applications.reduce((acc, app) => {
    acc[app.position] = (acc[app.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-foreground mb-8 flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" /> Analytics
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold font-display text-foreground mb-5">Hiring Pipeline</h2>
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

          {/* By Position */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold font-display text-foreground mb-5">By Position</h2>
            <div className="space-y-3">
              {Object.entries(positionBreakdown).map(([position, count]) => (
                <div key={position} className="flex items-center justify-between rounded-lg bg-muted/50 border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{position}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{count} applicant{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default RecruiterAnalytics;
