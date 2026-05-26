import { Document, Types } from 'mongoose';

// ── Project (embedded in User) ────────────────────────────────────────────────
export interface IProject {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  techStack: string[];
  link: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'applicant' | 'recruiter';
  avatar: string;
  phone: string;
  location: string;
  // Applicant
  bio: string;
  skills: string[];
  resumeUrl: string;
  projects: IProject[];
  linkedinUrl: string;
  // Recruiter
  company: string;
  companyLogo: string;
  companyWebsite: string;
  companyIndustry: string;
  companySize: string;
  companyDescription: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ── Application ───────────────────────────────────────────────────────────────
export type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offered' | 'rejected';

export interface IApplication extends Document {
  _id: Types.ObjectId;
  applicant: Types.ObjectId;
  recruiter?: Types.ObjectId;
  applicantName: string;
  position: string;
  company: string;
  appliedDate: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ── Interview ─────────────────────────────────────────────────────────────────
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface IInterview extends Document {
  _id: Types.ObjectId;
  applicant: Types.ObjectId;
  recruiter: Types.ObjectId;
  application?: Types.ObjectId;
  position: string;
  company: string;
  recruiterName: string;
  date: string;
  time: string;
  status: InterviewStatus;
  notes: string;
  meetingLink: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Message (embedded in Conversation) ───────────────────────────────────────
export interface IMessage {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Conversation ──────────────────────────────────────────────────────────────
export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: IUser[] | Types.ObjectId[];
  messages: IMessage[];
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType = 'interview' | 'application' | 'message' | 'info' | 'success';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  sender?: Types.ObjectId | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationModel {
  send(params: {
    recipient: Types.ObjectId | string;
    sender?: Types.ObjectId | string | null;
    title: string;
    message: string;
    type?: NotificationType;
  }): Promise<INotification>;
}

// ── PasswordReset ─────────────────────────────────────────────────────────────
export interface IPasswordReset extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  lockedUntil: Date | null;
  verified: boolean;
  createdAt: Date;
}

// ── Task ──────────────────────────────────────────────────────────────────────
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  link: string;
  difficulty: TaskDifficulty;
  recruiter: Types.ObjectId;
  recruiterName: string;
  assignedTo: Types.ObjectId[];
  dueDate: Date | null;
  maxScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── TaskSubmission ────────────────────────────────────────────────────────────
export type SubmissionStatus = 'submitted' | 'graded';

export interface ITaskSubmission extends Document {
  _id: Types.ObjectId;
  task: Types.ObjectId | ITask;
  applicant: Types.ObjectId | IUser;
  applicantName: string;
  submissionLink: string;
  note: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Note: req.user is globally available via types/express.d.ts augmentation.
// Use plain Request from express in all handlers — no AuthRequest needed.

// ── Request body shapes ───────────────────────────────────────────────────────
export interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: 'applicant' | 'recruiter';
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateApplicationBody {
  position: string;
  company: string;
  recruiterId?: string;
}

export interface UpdateStatusBody {
  status: ApplicationStatus;
}

export interface CreateInterviewBody {
  applicantId: string;
  applicationId?: string;
  position: string;
  company: string;
  date: string;
  time: string;
  notes?: string;
  meetingLink?: string;
}

export interface UpdateInterviewBody {
  status?: InterviewStatus;
  date?: string;
  time?: string;
  notes?: string;
  meetingLink?: string;
}

export interface SendMessageBody {
  receiverId: string;
  text: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  link: string;
  difficulty: TaskDifficulty;
  assignedTo?: string[];
  dueDate?: string;
  maxScore?: number;
}

export interface GradeSubmissionBody {
  score: number;
  feedback?: string;
}

export interface SubmitTaskBody {
  submissionLink: string;
  note?: string;
}