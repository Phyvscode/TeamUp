import { create } from "zustand";
import { authService } from "@/services/authService";
import { applicationService } from "@/services/applicationService";

/* ================================
   USER ROLE
================================ */

export type UserRole = "applicant" | "recruiter";

/* ================================
   PROJECT
================================ */

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

/* ================================
   USER
================================ */

interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  projects?: Project[];
  resumeUrl?: string;
}

/* ================================
   INTERVIEW
================================ */

export interface Interview {
  id?: string;
  applicantId: string;
  applicantName: string;
  recruiterId: string;
  recruiterName: string;
  company: string;
  position: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

/* ================================
   JOB APPLICATION
================================ */

export interface JobApplication {
  id?: string;
  position: string;
  company: string;
  status: "applied" | "reviewing" | "interview" | "offered" | "rejected";
  appliedDate: string;
  applicantId?: string;
  applicantName?: string;
}

/* ================================
   STORE STATE
================================ */

interface AppState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  interviews: Interview[];
  applications: JobApplication[];

  setRole: (role: UserRole) => void;
  login: (user: User) => void;
  logout: () => void;

  updateProfile: (data: Partial<User>) => void;

  addInterview: (interview: Interview) => void;
  addApplication: (app: JobApplication) => void;

  setInterviews: (interviews: Interview[]) => void;
  setApplications: (applications: JobApplication[]) => void;

  setLoading: (loading: boolean) => void;

  loginWithApi: (email: string, password: string) => Promise<void>;
  signupWithApi: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;

  logoutWithApi: () => void;

  fetchApplications: () => Promise<void>;
  fetchInterviews: () => Promise<void>;

  restoreSession: () => Promise<void>;
}

/* ================================
   STORE
================================ */

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,

  interviews: [],
  applications: [],

  setRole: (role) => set({ role }),

  login: (user) =>
    set({
      user,
      role: user.role,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      role: null,
      isAuthenticated: false,
      interviews: [],
      applications: [],
    }),

  updateProfile: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  addInterview: (interview) =>
    set((state) => ({
      interviews: [...state.interviews, interview],
    })),

  addApplication: (app) =>
    set((state) => ({
      applications: [...state.applications, app],
    })),

  setInterviews: (interviews) => set({ interviews }),
  setApplications: (applications) => set({ applications }),

  setLoading: (loading) => set({ isLoading: loading }),

  /* ================================
     LOGIN API
  ================================ */

  loginWithApi: async (email, password) => {
    set({ isLoading: true });

    try {
      const response = await authService.login({ email, password });

      const user = response.user;

      set({
        user,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ================================
     SIGNUP API
  ================================ */

  signupWithApi: async (name, email, password, role) => {
    set({ isLoading: true });

    try {
      const response = await authService.signup({
        name,
        email,
        password,
        role,
      });

      const user = response.user;

      set({
        user,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /* ================================
     LOGOUT API
  ================================ */

  logoutWithApi: () => {
    authService.logout();

    set({
      user: null,
      role: null,
      isAuthenticated: false,
      interviews: [],
      applications: [],
    });
  },

  /* ================================
     FETCH APPLICATIONS
  ================================ */

  fetchApplications: async () => {
    try {
      const applications = await applicationService.getApplications();
      set({ applications });
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    }
  },

  /* ================================
     FETCH INTERVIEWS
  ================================ */

  fetchInterviews: async () => {
    try {
      const interviews = await applicationService.getInterviews();
      set({ interviews });
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    }
  },

  /* ================================
     RESTORE SESSION
  ================================ */

  restoreSession: async () => {
    if (!authService.isAuthenticated()) return;

    set({ isLoading: true });

    try {
      const user = await authService.getMe();

      set({
        user,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      authService.logout();

      set({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));