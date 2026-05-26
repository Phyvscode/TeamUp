import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IProject } from '../types';

// ── Project sub-schema ────────────────────────────────────────────────────────
const projectSchema = new Schema<IProject>({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  techStack:   [{ type: String }],
  link:        { type: String, default: '' },
});

// ── User schema ───────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: [true, 'Name is required'],     trim: true },
    email:    { type: String, required: [true, 'Email is required'],    unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role:     { type: String, enum: ['applicant', 'recruiter'],         required: true },

    // ── Shared ────────────────────────────────────────────────────────────────
    avatar:   { type: String, default: '' },
    phone:    { type: String, default: '' },
    location: { type: String, default: '' },

    // ── Applicant fields ──────────────────────────────────────────────────────
    bio:         { type: String, default: '' },
    skills:      [{ type: String }],
    resumeUrl:   { type: String, default: '' },
    projects:    [projectSchema],
    linkedinUrl: { type: String, default: '' },

    // ── Recruiter fields ──────────────────────────────────────────────────────
    company:            { type: String, default: '' },
    companyLogo:        { type: String, default: '' },
    companyWebsite:     { type: String, default: '' },
    companyIndustry:    { type: String, default: '' },
    companySize:        { type: String, default: '' },
    companyDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Hash password before saving ───────────────────────────────────────────────
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance method: compare candidate password ───────────────────────────────
userSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// ── Strip password from JSON output ──────────────────────────────────────────
userSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.password;
  return obj;
};

const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);

export default User;