const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  techStack:   [{ type: String }],
  link:        { type: String, default: '' },
});

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, 'Name is required'], trim: true },
    email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role:     { type: String, enum: ['applicant', 'recruiter'], required: true },

    // ── Shared ────────────────────────────────────────────────────────────────
    avatar:   { type: String, default: '' },
    phone:    { type: String, default: '' },
    location: { type: String, default: '' },

    // ── Applicant fields ──────────────────────────────────────────────────────
    bio:       { type: String, default: '' },
    skills:    [{ type: String }],
    resumeUrl: { type: String, default: '' },
    projects:  [projectSchema],

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

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);