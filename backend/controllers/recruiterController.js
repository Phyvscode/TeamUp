const Application = require("../models/Application")
const Interview = require("../models/Interview")

exports.getApplicants = async (req, res) => {

  try {

    const applications = await Application.find()

    res.json(applications)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getDashboard = async (req, res) => {

  try {

    const applications = await Application.find()

    const interviews = await Interview.find()

    res.json({
      applications,
      interviews
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getAnalytics = async (req, res) => {

  try {

    const applications = await Application.find()

    const interviews = await Interview.find()

    const stats = {
      totalApplicants: applications.length,
      interviewsDone: interviews.filter(i => i.status === "completed").length,
      offers: applications.filter(a => a.status === "offered").length
    }

    res.json(stats)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}