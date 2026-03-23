import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection";
import AuthPage from "./pages/AuthPage";
import ApplicantDashboard from "./pages/applicant/ApplicantDashboard";
import ApplicantProfile from "./pages/applicant/ApplicantProfile";
import ApplicantInterviews from "./pages/applicant/ApplicantInterviews";
import ApplicantNotifications from "./pages/applicant/ApplicantNotifications";
import ApplicantMessages from "./pages/applicant/ApplicantMessages";
import ApplicantTasks from "./pages/applicant/ApplicantTasks";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterApplicants from "./pages/recruiter/RecruiterApplicants";
import RecruiterSchedule from "./pages/recruiter/RecruiterSchedule";
import RecruiterMessages from "./pages/recruiter/RecruiterMessages";
import RecruiterSettings from "./pages/recruiter/RecruiterSettings";
import RecruiterTasks from "./pages/recruiter/RecruiterTasks";
import RecruiterTaskAnalytics from "./pages/recruiter/RecruiterTaskAnalytics";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/applicant/dashboard"    element={<ApplicantDashboard />} />
          <Route path="/applicant/profile"       element={<ApplicantProfile />} />
          <Route path="/applicant/interviews"    element={<ApplicantInterviews />} />
          <Route path="/applicant/notifications" element={<ApplicantNotifications />} />
          <Route path="/applicant/messages"      element={<ApplicantMessages />} />
          <Route path="/applicant/tasks"         element={<ApplicantTasks />} />
          <Route path="/recruiter/dashboard"  element={<RecruiterDashboard />} />
          <Route path="/recruiter/applicants" element={<RecruiterApplicants />} />
          <Route path="/recruiter/schedule"   element={<RecruiterSchedule />} />
          <Route path="/recruiter/messages"   element={<RecruiterMessages />} />
          <Route path="/recruiter/settings"   element={<RecruiterSettings />} />
          <Route path="/recruiter/tasks"          element={<RecruiterTasks />} />
          <Route path="/recruiter/task-analytics" element={<RecruiterTaskAnalytics />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;