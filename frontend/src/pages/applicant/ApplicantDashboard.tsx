import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp
} from 'lucide-react'

const ApplicantDashboard = () => {

  const {
    user,
    interviews,
    applications,
    fetchApplications,
    fetchInterviews
  } = useAppStore()

  useEffect(() => {
    fetchApplications()
    fetchInterviews()
  }, [])

  const stats = [
    {
      label: "Applications",
      value: applications.length,
      icon: Briefcase,
      color: "text-primary"
    },
    {
      label: "Interviews",
      value: interviews.filter(i => i.status === "scheduled").length,
      icon: Calendar,
      color: "text-primary"
    },
    {
      label: "In Review",
      value: applications.filter(a => a.status === "reviewing").length,
      icon: Clock,
      color: "text-yellow-500"
    },
    {
      label: "Offers",
      value: applications.filter(a => a.status === "offered").length,
      icon: CheckCircle,
      color: "text-green-500"
    }
  ]

  return (
    <DashboardLayout>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h1 className="text-3xl font-bold font-display text-foreground mb-1">
          Welcome back,
          <span className="text-gradient-orange ml-2">
            {user?.name}
          </span>
        </h1>

        <p className="text-muted-foreground mb-8">
          Here's an overview of your job search
        </p>

        {/* Stats */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {stats.map((stat, i) => (

            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >

              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>

              <p className="text-2xl font-bold font-display text-foreground">
                {stat.value}
              </p>

              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>

            </motion.div>

          ))}

        </div>

        {/* Upcoming Interviews */}

        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">

          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Interviews
          </h2>

          <div className="space-y-3">

            {interviews
              .filter(i => i.status === "scheduled")
              .map(interview => (

                <div
                  key={interview.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                >

                  <div>

                    <p className="font-medium text-foreground">
                      {interview.position}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {interview.company}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-medium text-primary">
                      {interview.date}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {interview.time}
                    </p>

                  </div>

                </div>

              ))}

            {interviews.filter(i => i.status === "scheduled").length === 0 && (
              <p className="text-sm text-muted-foreground">
                No upcoming interviews scheduled yet.
              </p>
            )}

          </div>

        </div>

        {/* Recent Applications */}

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">

          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Recent Applications
          </h2>

          <div className="space-y-3">

            {applications.slice(0, 4).map(app => (

              <div
                key={app.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
              >

                <div>

                  <p className="font-medium text-foreground">
                    {app.position}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {app.company}
                  </p>

                </div>

                <StatusBadge status={app.status} />

              </div>

            ))}

            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No applications yet.
              </p>
            )}

          </div>

        </div>

      </motion.div>

    </DashboardLayout>
  )
}

const StatusBadge = ({ status }: { status: string }) => {

  const styles: Record<string, string> = {
    applied: "bg-muted text-muted-foreground",
    reviewing: "bg-yellow-500/10 text-yellow-500",
    interview: "bg-primary/10 text-primary",
    offered: "bg-green-500/10 text-green-500",
    rejected: "bg-destructive/10 text-destructive"
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] || styles.applied
      }`}
    >
      {status}
    </span>
  )
}

export default ApplicantDashboard