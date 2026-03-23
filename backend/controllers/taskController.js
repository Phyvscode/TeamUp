const Task           = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const Notification   = require('../models/Notification');
const User           = require('../models/User');

// ── GET /api/tasks ────────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    let tasks;

    if (req.user.role === 'recruiter') {
      tasks = await Task.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({
        isActive: true,
        $or: [
          { assignedTo: { $size: 0 } },
          { assignedTo: req.user._id },
        ],
      }).sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/submissions/all ────────────────────────────────────────────
// Must be defined before /:id to avoid route conflict
exports.getAllSubmissions = async (req, res, next) => {
  try {
    const myTasks = await Task.find({ recruiter: req.user._id }).select('_id');
    const taskIds = myTasks.map((t) => t._id);

    const submissions = await TaskSubmission.find({ task: { $in: taskIds } })
      .populate('task', 'title difficulty maxScore link')
      .populate('applicant', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/my-submissions/list ────────────────────────────────────────
// Must be defined before /:id to avoid route conflict
exports.getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await TaskSubmission.find({ applicant: req.user._id })
      .populate('task', 'title difficulty maxScore link recruiterName dueDate')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks ───────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, link, difficulty, assignedTo, dueDate, maxScore } = req.body;

    if (!title || !link || !difficulty) {
      return res.status(400).json({ message: 'title, link, and difficulty are required.' });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'difficulty must be easy, medium, or hard.' });
    }

    const task = await Task.create({
      title,
      description:   description || '',
      link,
      difficulty,
      recruiter:     req.user._id,
      recruiterName: req.user.name,
      assignedTo:    assignedTo  || [],
      dueDate:       dueDate     || null,
      maxScore:      maxScore    || 100,
    });

    // Notify targeted applicants or all applicants if broadcast
    let recipientIds = [];
    if (assignedTo && assignedTo.length > 0) {
      recipientIds = assignedTo;
    } else {
      const allApplicants = await User.find({ role: 'applicant' }).select('_id');
      recipientIds = allApplicants.map((u) => u._id);
    }

    const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    await Promise.all(
      recipientIds.map((recipientId) =>
        Notification.send({
          recipient: recipientId,
          sender:    req.user._id,
          title:     `📋 New ${diffLabel} Task Assigned`,
          message:   `${req.user.name} has assigned you a new task: "${title}". Open the Tasks section to view and complete it.`,
          type:      'info',
        })
      )
    );

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found or not yours.' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id:       req.params.id,
      recruiter: req.user._id,
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    await TaskSubmission.deleteMany({ task: req.params.id });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/:id/submissions ────────────────────────────────────────────
exports.getSubmissionsForTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, recruiter: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const submissions = await TaskSubmission.find({ task: req.params.id })
      .populate('applicant', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks/:id/submit ────────────────────────────────────────────────
exports.submitTask = async (req, res, next) => {
  try {
    const { submissionLink, note } = req.body;

    if (!submissionLink) {
      return res.status(400).json({ message: 'submissionLink is required.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const submission = await TaskSubmission.findOneAndUpdate(
      { task: req.params.id, applicant: req.user._id },
      {
        $set: {
          submissionLink,
          note:          note || '',
          applicantName: req.user.name,
          status:        'submitted',
          score:         null,
          feedback:      '',
          gradedAt:      null,
        },
        $setOnInsert: {
          task:      req.params.id,
          applicant: req.user._id,
        },
      },
      { upsert: true, new: true }
    );

    await Notification.send({
      recipient: task.recruiter,
      sender:    req.user._id,
      title:     '📥 New Task Submission',
      message:   `${req.user.name} submitted their work for the task "${task.title}". Review it in the Tasks section.`,
      type:      'info',
    });

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tasks/submissions/:submissionId/grade ──────────────────────────
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { score, feedback } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'score is required.' });
    }

    const submission = await TaskSubmission.findById(req.params.submissionId).populate('task');
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    if (submission.task.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not own this task.' });
    }

    if (score < 0 || score > submission.task.maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${submission.task.maxScore}.` });
    }

    submission.score    = score;
    submission.feedback = feedback || '';
    submission.status   = 'graded';
    submission.gradedAt = new Date();
    await submission.save();

    const pct = Math.round((score / submission.task.maxScore) * 100);

    await Notification.send({
      recipient: submission.applicant,
      sender:    req.user._id,
      title:     `🏆 Task Graded — ${submission.task.title}`,
      message:
        `Your submission for "${submission.task.title}" has been graded.\n` +
        `Score: ${score}/${submission.task.maxScore} (${pct}%)` +
        (feedback ? `\n\nFeedback: ${feedback}` : ''),
      type: 'success',
    });

    res.json(submission);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/analytics/scores ──────────────────────────────────────────
// Returns graded submission data grouped by difficulty for line graphs
exports.getScoreAnalytics = async (req, res, next) => {
  try {
    const myTasks = await Task.find({ recruiter: req.user._id })
      .select('_id title difficulty maxScore')
      .sort({ createdAt: 1 });

    const taskIds = myTasks.map((t) => t._id);
    const submissions = await TaskSubmission.find({
      task:   { $in: taskIds },
      status: 'graded',
    })
      .populate('applicant', 'name')
      .lean();

    const taskMap = {};
    myTasks.forEach((t) => { taskMap[t._id.toString()] = t; });

    const difficulties = ['easy', 'medium', 'hard'];
    const result = {};

    difficulties.forEach((diff) => {
      const diffTasks = myTasks.filter((t) => t.difficulty === diff);
      const diffSubs  = submissions.filter(
        (s) => taskMap[s.task.toString()]?.difficulty === diff
      );

      const applicantMap = {};
      diffSubs.forEach((sub) => {
        const appId   = sub.applicant._id.toString();
        const appName = sub.applicant.name;
        const task    = taskMap[sub.task.toString()];
        const pct     = task ? Math.round((sub.score / task.maxScore) * 100) : 0;

        if (!applicantMap[appId]) {
          applicantMap[appId] = { id: appId, name: appName, scores: {} };
        }
        applicantMap[appId].scores[sub.task.toString()] = pct;
      });

      const chartData = diffTasks.map((task) => {
        const row = { task: task.title, taskId: task._id.toString(), maxScore: task.maxScore };
        Object.values(applicantMap).forEach((app) => {
          row[app.name] = app.scores[task._id.toString()] ?? null;
        });
        return row;
      });

      result[diff] = {
        tasks:      diffTasks.map((t) => t.title),
        applicants: Object.values(applicantMap).map((a) => ({ id: a.id, name: a.name })),
        chartData,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};