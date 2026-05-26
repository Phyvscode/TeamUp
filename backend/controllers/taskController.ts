import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  ITask, ITaskSubmission, TaskDifficulty,
  CreateTaskBody, GradeSubmissionBody, SubmitTaskBody,
} from '../types';
import Task           from '../models/Task';
import TaskSubmission from '../models/TaskSubmission';
import Notification   from '../models/Notification';
import User           from '../models/User';

// ── GET /api/tasks ────────────────────────────────────────────────────────────
export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks: ITask[] = req.user.role === 'recruiter'
      ? await Task.find({ recruiter: req.user._id }).sort({ createdAt: -1 })
      : await Task.find({
          isActive: true,
          $or: [{ assignedTo: { $size: 0 } }, { assignedTo: req.user._id }],
        }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/submissions/all ────────────────────────────────────────────
export const getAllSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const myTasks = await Task.find({ recruiter: req.user._id }).select('_id');
    const taskIds = myTasks.map((t) => t._id);

    const submissions: ITaskSubmission[] = await TaskSubmission.find({ task: { $in: taskIds } })
      .populate('task', 'title difficulty maxScore link')
      .populate('applicant', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/my-submissions/list ────────────────────────────────────────
export const getMySubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const submissions: ITaskSubmission[] = await TaskSubmission.find({ applicant: req.user._id })
      .populate('task', 'title difficulty maxScore link recruiterName dueDate')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
export const getTaskById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task: ITask | null = await Task.findById(req.params.id);
    if (!task) { res.status(404).json({ message: 'Task not found.' }); return; }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks ───────────────────────────────────────────────────────────
export const createTask = async (
  req: Request<{}, {}, CreateTaskBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, link, difficulty, assignedTo, dueDate, maxScore } = req.body;

    if (!title || !link || !difficulty) {
      res.status(400).json({ message: 'title, link, and difficulty are required.' });
      return;
    }
    const validDifficulties: TaskDifficulty[] = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({ message: 'difficulty must be easy, medium, or hard.' });
      return;
    }

    const task: ITask = await Task.create({
      title,
      description:   description ?? '',
      link,
      difficulty,
      recruiter:     req.user._id,
      recruiterName: req.user.name,
      assignedTo:    assignedTo ?? [],
      dueDate:       dueDate    ?? null,
      maxScore:      maxScore   ?? 100,
    });

    const recipientIds: string[] = (assignedTo && assignedTo.length > 0)
      ? assignedTo
      : (await User.find({ role: 'applicant' }).select('_id')).map((u) => u._id.toString());

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
export const updateTask = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task: ITask | null = await Task.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) { res.status(404).json({ message: 'Task not found or not yours.' }); return; }
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
export const deleteTask = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task: ITask | null = await Task.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
    if (!task) { res.status(404).json({ message: 'Task not found.' }); return; }
    await TaskSubmission.deleteMany({ task: req.params.id });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/:id/submissions ────────────────────────────────────────────
export const getSubmissionsForTask = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task: ITask | null = await Task.findOne({ _id: req.params.id, recruiter: req.user._id });
    if (!task) { res.status(404).json({ message: 'Task not found.' }); return; }

    const submissions: ITaskSubmission[] = await TaskSubmission.find({ task: req.params.id })
      .populate('applicant', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks/:id/submit ────────────────────────────────────────────────
export const submitTask = async (
  req: Request<{ id: string }, {}, SubmitTaskBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { submissionLink, note } = req.body;
    if (!submissionLink) { res.status(400).json({ message: 'submissionLink is required.' }); return; }

    const task: ITask | null = await Task.findById(req.params.id);
    if (!task || !task.isActive) { res.status(404).json({ message: 'Task not found.' }); return; }

    const submission: ITaskSubmission = await TaskSubmission.findOneAndUpdate(
      { task: req.params.id, applicant: req.user._id },
      {
        $set: { submissionLink, note: note ?? '', applicantName: req.user.name, status: 'submitted', score: null, feedback: '', gradedAt: null },
        $setOnInsert: { task: req.params.id, applicant: req.user._id },
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
export const gradeSubmission = async (
  req: Request<{ submissionId: string }, {}, GradeSubmissionBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { score, feedback } = req.body;
    if (score === undefined || score === null) { res.status(400).json({ message: 'score is required.' }); return; }

    const submission: ITaskSubmission | null = await TaskSubmission.findById(req.params.submissionId).populate('task');
    if (!submission) { res.status(404).json({ message: 'Submission not found.' }); return; }

    const task = submission.task as ITask;
    if (task.recruiter.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'You do not own this task.' }); return;
    }
    if (score < 0 || score > task.maxScore) {
      res.status(400).json({ message: `Score must be between 0 and ${task.maxScore}.` }); return;
    }

    submission.score    = score;
    submission.feedback = feedback ?? '';
    submission.status   = 'graded';
    submission.gradedAt = new Date();
    await submission.save();

    const pct = Math.round((score / task.maxScore) * 100);
    // applicant field is ObjectId when not populated — cast safely
    const applicantId = (submission.applicant as Types.ObjectId | { _id: Types.ObjectId });
    const recipientId = '_id' in applicantId ? applicantId._id : applicantId;

    await Notification.send({
      recipient: recipientId,
      sender:    req.user._id,
      title:     `🏆 Task Graded — ${task.title}`,
      message:
        `Your submission for "${task.title}" has been graded.\n` +
        `Score: ${score}/${task.maxScore} (${pct}%)` +
        (feedback ? `\n\nFeedback: ${feedback}` : ''),
      type: 'success',
    });

    res.json(submission);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/analytics/scores ──────────────────────────────────────────
export const getScoreAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const myTasks: ITask[] = await Task.find({ recruiter: req.user._id })
      .select('_id title difficulty maxScore')
      .sort({ createdAt: 1 });

    const taskIds = myTasks.map((t) => t._id);
    const submissions: ITaskSubmission[] = await TaskSubmission.find({ task: { $in: taskIds }, status: 'graded' })
      .populate('applicant', 'name')
      .lean();

    const taskMap: Record<string, ITask> = {};
    myTasks.forEach((t) => { taskMap[t._id.toString()] = t; });

    interface ApplicantEntry { id: string; name: string; scores: Record<string, number>; }
    interface ChartRow { task: string; taskId: string; maxScore: number; [name: string]: any; }

    const difficulties: TaskDifficulty[] = ['easy', 'medium', 'hard'];
    const result: Record<string, { tasks: string[]; applicants: { id: string; name: string }[]; chartData: ChartRow[] }> = {};

    difficulties.forEach((diff) => {
      const diffTasks = myTasks.filter((t) => t.difficulty === diff);
      const diffSubs  = submissions.filter((s) => taskMap[(s.task as any).toString()]?.difficulty === diff);

      const applicantMap: Record<string, ApplicantEntry> = {};
      diffSubs.forEach((sub) => {
        const applicant = sub.applicant as any;
        const appId     = applicant._id.toString();
        const task      = taskMap[(sub.task as any).toString()];
        const pct       = task ? Math.round((sub.score! / task.maxScore) * 100) : 0;
        if (!applicantMap[appId]) applicantMap[appId] = { id: appId, name: applicant.name, scores: {} };
        applicantMap[appId].scores[(sub.task as any).toString()] = pct;
      });

      result[diff] = {
        tasks:      diffTasks.map((t) => t.title),
        applicants: Object.values(applicantMap).map((a) => ({ id: a.id, name: a.name })),
        chartData:  diffTasks.map((task) => {
          const row: ChartRow = { task: task.title, taskId: task._id.toString(), maxScore: task.maxScore };
          Object.values(applicantMap).forEach((app) => { row[app.name] = app.scores[task._id.toString()] ?? null; });
          return row;
        }),
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};