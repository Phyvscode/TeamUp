import { motion } from 'framer-motion';
import { Briefcase, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, UserRole } from '@/store/useAppStore';

const RoleSelection = () => {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);

  const handleSelect = (role: UserRole) => {
    setRole(role);
    navigate('/auth');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30" style={{ background: 'var(--gradient-glow)' }} />

      <div className="relative z-10 w-full max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold font-display mb-4">
            <span className="text-gradient-orange">Teamed</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Your gateway to seamless hiring and job applications
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-foreground text-xl font-display mb-10"
        >
          I am a...
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RoleCard
            icon={<User className="w-10 h-10" />}
            title="Job Applicant"
            description="Find your dream job, track applications, and manage your professional profile"
            delay={0.3}
            onClick={() => handleSelect('applicant')}
          />
          <RoleCard
            icon={<Briefcase className="w-10 h-10" />}
            title="Recruiter"
            description="Post jobs, review candidates, and schedule interviews efficiently"
            delay={0.4}
            onClick={() => handleSelect('recruiter')}
          />
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({
  icon,
  title,
  description,
  delay,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  onClick: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.03, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group relative rounded-xl border border-border bg-card p-8 text-left transition-colors hover:border-primary shadow-card"
  >
    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity glow-orange" />
    <div className="relative z-10">
      <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </motion.button>
);

export default RoleSelection;
