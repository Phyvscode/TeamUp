import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Zap, Target, Flame, Loader2, BarChart3, Users, AlertCircle } from 'lucide-react';

const API   = 'http://localhost:5000';
const token = () => localStorage.getItem('auth_token');

// ── Palette — one distinct colour per applicant line ─────────────────────────
const LINE_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444',
  '#eab308', '#06b6d4', '#ec4899', '#14b8a6', '#f59e0b',
];

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFF_CONFIG = {
  easy: {
    Icon:        Zap,
    label:       'Easy Tasks',
    color:       'text-green-500',
    bg:          'bg-green-500/10',
    border:      'border-green-500/30',
    gridColor:   '#22c55e22',
    axisColor:   '#22c55e99',
  },
  medium: {
    Icon:        Target,
    label:       'Medium Tasks',
    color:       'text-yellow-500',
    bg:          'bg-yellow-500/10',
    border:      'border-yellow-500/30',
    gridColor:   '#eab30822',
    axisColor:   '#eab30899',
  },
  hard: {
    Icon:        Flame,
    label:       'Hard Tasks',
    color:       'text-destructive',
    bg:          'bg-destructive/10',
    border:      'border-destructive/30',
    gridColor:   '#ef444422',
    axisColor:   '#ef444499',
  },
};

interface Applicant { id: string; name: string; }
interface ChartRow  { task: string; taskId: string; maxScore: number; [applicant: string]: any; }
interface DiffData  { tasks: string[]; applicants: Applicant[]; chartData: ChartRow[]; }
interface Analytics { easy: DiffData; medium: DiffData; hard: DiffData; }

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl p-4 min-w-[180px]">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 truncate max-w-[200px]">
        {label}
      </p>
      <div className="space-y-2">
        {payload
          .filter((p: any) => p.value !== null && p.value !== undefined)
          .sort((a: any, b: any) => b.value - a.value)
          .map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm text-foreground truncate max-w-[120px]">{p.name}</span>
              </div>
              <span className="text-sm font-bold shrink-0" style={{ color: p.color }}>
                {p.value}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

// ── Custom Legend ─────────────────────────────────────────────────────────────
const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="mt-4 px-2">
      <div
        className="flex flex-row items-center gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {payload.map((entry: any) => (
          <div
            key={entry.value}
            className="flex items-center gap-1.5 shrink-0"
          >
            <div
              className="w-8 h-0.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: entry.color }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Empty state for one chart ────────────────────────────────────────────────
const EmptyChart = ({ diff }: { diff: 'easy' | 'medium' | 'hard' }) => {
  const cfg = DIFF_CONFIG[diff];
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <AlertCircle className={`w-8 h-8 ${cfg.color} opacity-30`} />
      <p className="text-sm text-muted-foreground text-center">
        No graded {cfg.label.toLowerCase()} yet.<br />
        <span className="text-xs">Grades will appear here once you score submissions.</span>
      </p>
    </div>
  );
};

// ── Chart for one difficulty ──────────────────────────────────────────────────
const DifficultyChart = ({
  diff, data, index,
}: {
  diff: 'easy' | 'medium' | 'hard';
  data: DiffData;
  index: number;
}) => {
  const cfg = DIFF_CONFIG[diff];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className={`rounded-2xl border ${cfg.border} bg-card shadow-card overflow-hidden`}
    >
      {/* Card header */}
      <div className={`${cfg.bg} px-6 py-4 flex items-center justify-between border-b ${cfg.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
            <cfg.Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <h2 className={`font-bold font-display ${cfg.color}`}>{cfg.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''} ·{' '}
              {data.applicants.length} applicant{data.applicants.length !== 1 ? 's' : ''} ·{' '}
              Score %
            </p>
          </div>
        </div>

        {/* Applicant count badge */}
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{data.applicants.length}</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-6">
        {data.applicants.length === 0 || data.chartData.length === 0 ? (
          <EmptyChart diff={diff} />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data.chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="task"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={0}
                // Truncate long task names on x-axis
                tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 14) + '…' : v}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />

              {data.applicants.map((applicant, i) => (
                <Line
                  key={applicant.id}
                  type="monotone"
                  dataKey={applicant.name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{
                    r: 5,
                    fill: LINE_COLORS[i % LINE_COLORS.length],
                    strokeWidth: 2,
                    stroke: 'hsl(var(--card))',
                  }}
                  activeDot={{
                    r: 8,
                    fill: LINE_COLORS[i % LINE_COLORS.length],
                    stroke: 'hsl(var(--card))',
                    strokeWidth: 2,
                  }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RecruiterTaskAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/tasks/analytics/scores`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Total graded submissions across all difficulties
  const totalGraded = analytics
    ? (['easy', 'medium', 'hard'] as const).reduce((sum, d) => {
        const subs = analytics[d].chartData.reduce((s, row) => {
          return s + analytics[d].applicants.filter((a) => row[a.name] !== null && row[a.name] !== undefined).length;
        }, 0);
        return sum + subs;
      }, 0)
    : 0;

  const totalApplicants = analytics
    ? new Set([
        ...analytics.easy.applicants.map((a) => a.id),
        ...analytics.medium.applicants.map((a) => a.id),
        ...analytics.hard.applicants.map((a) => a.id),
      ]).size
    : 0;

  const totalTasks = analytics
    ? analytics.easy.tasks.length + analytics.medium.tasks.length + analytics.hard.tasks.length
    : 0;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            Task Score Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Line graphs showing each applicant's score (%) across all graded tasks
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive opacity-40" />
            <p className="text-muted-foreground">{error}</p>
            <button onClick={fetchAnalytics} className="text-sm text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Tasks',          value: totalTasks,      icon: BarChart3, color: 'text-primary' },
                { label: 'Applicants Graded',    value: totalApplicants, icon: Users,     color: 'text-primary' },
                { label: 'Total Graded Submissions', value: totalGraded, icon: Zap,       color: 'text-green-500' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card p-5 shadow-card"
                >
                  <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                  <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* One chart per difficulty */}
            <div className="space-y-6">
              {(['easy', 'medium', 'hard'] as const).map((diff, i) => (
                <DifficultyChart
                  key={diff}
                  diff={diff}
                  data={analytics![diff]}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

      </motion.div>
    </DashboardLayout>
  );
};

export default RecruiterTaskAnalytics;