const express = require('express');
const router  = express.Router();

const { getApplicants, getRecruiters, startConversation } = require('../controllers/userController');
const { protect, }   = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

router.use(protect);

// Recruiter browses all applicants
router.get('/applicants',          restrictTo('recruiter'), getApplicants);

// Applicant browses all recruiters
router.get('/recruiters',          restrictTo('applicant'), getRecruiters);

// Either role starts (or retrieves) a conversation with another user
router.post('/start-conversation', startConversation);

module.exports = router;