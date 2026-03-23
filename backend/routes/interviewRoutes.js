const express = require('express');
const router  = express.Router();

const {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
} = require('../controllers/interviewController');

const { protect }    = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.use(protect);

router.get   ('/',    getInterviews);
router.post  ('/',    restrictTo('recruiter'), createInterview);
router.patch ('/:id', restrictTo('recruiter'), updateInterview);
router.delete('/:id', restrictTo('recruiter'), deleteInterview);

module.exports = router;