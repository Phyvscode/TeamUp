const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getSubmissionsForTask,
  getAllSubmissions,
  submitTask,
  getMySubmissions,
  gradeSubmission,
  getScoreAnalytics,
} = require('../controllers/taskController');

// All routes require a logged-in user
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: static paths MUST come before dynamic /:id paths
// otherwise Express matches "submissions" or "my-submissions" as the :id param
// ─────────────────────────────────────────────────────────────────────────────

// Static routes first
router.get('/analytics/scores',       restrictTo('recruiter'), getScoreAnalytics);
router.get('/submissions/all',        restrictTo('recruiter'), getAllSubmissions);
router.get('/my-submissions/list',    restrictTo('applicant'), getMySubmissions);
router.patch('/submissions/:submissionId/grade', restrictTo('recruiter'), gradeSubmission);

// Collection routes
router.get('/',  getTasks);
router.post('/', restrictTo('recruiter'), createTask);

// Dynamic :id routes last
router.get('/:id',    getTaskById);
router.patch('/:id',  restrictTo('recruiter'), updateTask);
router.delete('/:id', restrictTo('recruiter'), deleteTask);
router.get('/:id/submissions',  restrictTo('recruiter'), getSubmissionsForTask);
router.post('/:id/submit',      restrictTo('applicant'), submitTask);

module.exports = router;