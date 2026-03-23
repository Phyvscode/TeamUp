import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { BellDot, Briefcase, Calendar, CheckCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type?: "interview" | "application" | "info" | "success";
  createdAt?: string;
  read: boolean;
}

const iconMap = {
  interview: Calendar,
  application: Briefcase,
  info: Info,
  success: CheckCircle
};

const colorMap = {
  interview: "text-primary bg-primary/10",
  application: "text-yellow-500 bg-yellow-500/10",
  info: "text-muted-foreground bg-muted",
  success: "text-green-500 bg-green-500/10"
};

const ApplicantNotifications = () => {

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`
          }
        }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.error("Unexpected notification response:", data);
        setNotifications([]);
      }

    } catch (err) {

      console.error("Failed to load notifications", err);

    } finally {
      setLoading(false);
    }

  };

  const markAllRead = async () => {

    try {

      await fetch(
        "http://localhost:5000/api/notifications/read",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`
          }
        }
      );

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

    } catch (err) {

      console.error("Failed to mark notifications read", err);

    }

  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (

    <DashboardLayout>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <div className="flex items-center justify-between mb-8">

          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">

            <BellDot className="w-7 h-7 text-primary" />

            Notifications

            {unreadCount > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5">
                {unreadCount}
              </span>
            )}

          </h1>

          {unreadCount > 0 && (

            <button
              onClick={markAllRead}
              className="text-sm text-primary hover:underline"
            >
              Mark all as read
            </button>

          )}

        </div>

        {loading && (
          <p className="text-muted-foreground text-sm">
            Loading notifications...
          </p>
        )}

        <div className="space-y-3">

          {!loading && notifications?.map((notif, i) => {

            const Icon = iconMap[notif.type as keyof typeof iconMap] || Info;
            const color =
              colorMap[notif.type as keyof typeof colorMap] ||
              "text-muted-foreground bg-muted";

            return (

              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border border-border bg-card p-5 shadow-card flex items-start gap-4 ${
                  !notif.read
                    ? "border-l-4 border-l-primary"
                    : "opacity-70"
                }`}
              >

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">

                  <p className="font-semibold text-foreground text-sm">
                    {notif.title}
                  </p>

                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notif.message}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString()
                      : ""}
                  </p>

                </div>

              </motion.div>

            );

          })}

          {!loading && notifications.length === 0 && (

            <p className="text-muted-foreground text-sm">
              No notifications yet.
            </p>

          )}

        </div>

      </motion.div>

    </DashboardLayout>

  );

};

export default ApplicantNotifications;