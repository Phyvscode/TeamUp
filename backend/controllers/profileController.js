const User = require('../models/User');

// ── GET /api/profile ──────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/profile ──────────────────────────────────────────────────────────
// Handles both applicant and recruiter fields — only sets what is sent
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      // shared
      name, email, phone, location,
      // applicant
      bio, skills, company, linkedinUrl,
      // recruiter
      companyWebsite, companyIndustry, companySize, companyDescription,
    } = req.body;

    const updates = {};
    if (name               !== undefined) updates.name               = name;
    if (email              !== undefined) updates.email              = email;
    if (phone              !== undefined) updates.phone              = phone;
    if (location           !== undefined) updates.location           = location;
    if (bio                !== undefined) updates.bio                = bio;
    if (skills             !== undefined) updates.skills             = skills;
    if (company            !== undefined) updates.company            = company;
    if (linkedinUrl        !== undefined) updates.linkedinUrl        = linkedinUrl;
    if (companyWebsite     !== undefined) updates.companyWebsite     = companyWebsite;
    if (companyIndustry    !== undefined) updates.companyIndustry    = companyIndustry;
    if (companySize        !== undefined) updates.companySize        = companySize;
    if (companyDescription !== undefined) updates.companyDescription = companyDescription;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/avatar ──────────────────────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/company-logo ───────────────────────────────────────────
exports.uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

    const logoPath = `/uploads/logos/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { companyLogo: logoPath },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/resume ──────────────────────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file provided.' });

    const resumePath = `/uploads/resumes/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resumeUrl: resumePath },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/change-password ────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    // Re-fetch with password field (select: false by default)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Hash the new password manually and update directly —
    // avoids any pre-save hook reliability issues with select('+password') documents
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ _id: req.user._id }, { $set: { password: hashed } });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/projects ────────────────────────────────────────────────
exports.addProject = async (req, res, next) => {
  try {
    const { title, description, techStack, link } = req.body;
    if (!title) return res.status(400).json({ message: 'Project title is required.' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { projects: { title, description, techStack, link } } },
      { new: true }
    );
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/profile/projects/:projectId ───────────────────────────────────
exports.deleteProject = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { projects: { _id: req.params.projectId } } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};