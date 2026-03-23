const express = require("express")

const router = express.Router()

const protect = require("../middleware/authMiddleware")
const roleMiddleware = require("../middleware/roleMiddleware")

const {
  getApplicants,
  getDashboard,
  getAnalytics
} = require("../controllers/recruiterController")

router.get(
  "/dashboard",
  protect,
  roleMiddleware("recruiter"),
  getDashboard
)

router.get(
  "/analytics",
  protect,
  roleMiddleware("recruiter"),
  getAnalytics
)

router.get(
  "/applicants",
  protect,
  roleMiddleware("recruiter"),
  getApplicants
)

module.exports = router