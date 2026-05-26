import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard,
  User,
  Calendar,
  LogOut,
  Briefcase,
  Users,
  CalendarPlus,
  Bell,
  MessageSquare,
  Settings,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logoutWithApi } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutWithApi();
    navigate('/');
  };

  const isApplicant = user?.role === 'applicant';

  const navItems = isApplicant
    ? [
        { to: '/applicant/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/applicant/profile',        icon: User,            label: 'Profile' },
        { to: '/applicant/interviews',     icon: Calendar,        label: 'Interviews' },
        { to: '/applicant/notifications',  icon: Bell,            label: 'Notifications' },
        { to: '/applicant/messages',       icon: MessageSquare,   label: 'Messages' },
        { to: '/applicant/tasks',          icon: ClipboardList,   label: 'Tasks' },
      ]
    : [
        { to: '/recruiter/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/recruiter/applicants', icon: Users,           label: 'Applicants' },
        { to: '/recruiter/schedule',   icon: CalendarPlus,    label: 'Schedule' },
        { to: '/recruiter/messages',   icon: MessageSquare,   label: 'Messages' },
        { to: '/recruiter/tasks',          icon: ClipboardList,   label: 'Tasks' },
        { to: '/recruiter/task-analytics', icon: BarChart3,        label: 'Task Analytics' },
        { to: '/recruiter/settings',   icon: Settings,        label: 'Settings' },
      ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <span className="text-2xl font-bold font-display text-gradient-orange">Teamed</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;