const express = require('express');
const router  = express.Router();

const {
  getApplications,
  createApplication,
  updateStatus,
  deleteApplication,
} = require('../controllers/applicationController');

const { protect }    = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.use(protect);

router.get   ('/',            getApplications);
router.post  ('/',            restrictTo('applicant'), createApplication);
router.patch ('/:id/status',  restrictTo('recruiter'), updateStatus);
router.delete('/:id',         restrictTo('applicant'), deleteApplication);

module.exports = router;