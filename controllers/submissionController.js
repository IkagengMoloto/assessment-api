const Submission = require("../models/Submission");
const Assessment = require("../models/Assessment");

// STUDENT: Submit an assessment
exports.submitAssessment = async (req, res) => {
    try {
        const { assessmentId, answers } = req.body;

        // Basic validation
        if (!assessmentId || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Assessment ID and answers are required"
            });
        }

        // Check that the assessment exists
        const assessment = await Assessment.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        // Prevent the same student from submitting twice
        const existingSubmission = await Submission.findOne({
            assessment: assessmentId,
            student: req.user._id
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: "Assessment already submitted"
            });
        }

        // Ensure all assessment questions are answered
        if (answers.length !== assessment.questions.length) {
            return res.status(400).json({
                success: false,
                message: "All assessment questions must be answered"
            });
        }

        // Get valid question IDs from the assessment
        const validQuestionIds = assessment.questions.map(
            question => question._id.toString()
        );

        // Validate every submitted question ID
        const invalidAnswer = answers.find(
            item =>
                !item.questionId ||
                !validQuestionIds.includes(item.questionId.toString())
        );

        if (invalidAnswer) {
            return res.status(400).json({
                success: false,
                message: "One or more question IDs are invalid"
            });
        }

        // Check for duplicate question IDs in the answers
        const submittedQuestionIds = answers.map(
            item => item.questionId.toString()
        );

        const uniqueQuestionIds = new Set(submittedQuestionIds);

        if (uniqueQuestionIds.size !== submittedQuestionIds.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate question IDs are not allowed"
            });
        }

        // Check every answer contains text
        const emptyAnswer = answers.find(
            item =>
                !item.answer ||
                typeof item.answer !== "string" ||
                item.answer.trim() === ""
        );

        if (emptyAnswer) {
            return res.status(400).json({
                success: false,
                message: "Every question must have an answer"
            });
        }

        // Create the submission
        const submission = await Submission.create({
            assessment: assessmentId,
            student: req.user._id,
            answers,
            status: "submitted"
        });

        res.status(201).json({
            success: true,
            message: "Assessment submitted successfully",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// STUDENT: View own submissions and results
exports.getMySubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            student: req.user._id
        })
            .populate(
                "assessment",
                "title description"
            )
            .populate(
                "evaluatedBy",
                "name email"
            );

        res.status(200).json({
            success: true,
            count: submissions.length,
            submissions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EVALUATOR: View submissions waiting for evaluation
exports.getPendingSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            status: {
                $in: ["submitted", "pending_review"]
            }
        })
            .populate(
                "student",
                "name email"
            )
            .populate(
                "assessment"
            );

        res.status(200).json({
            success: true,
            count: submissions.length,
            submissions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EVALUATOR: Move submission from submitted to pending_review
exports.startReview = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        if (submission.status !== "submitted") {
            return res.status(400).json({
                success: false,
                message: "Only submitted assessments can be moved to pending review"
            });
        }

        submission.status = "pending_review";

        await submission.save();

        res.status(200).json({
            success: true,
            message: "Submission moved to pending review",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EVALUATOR: Score a submission
exports.scoreSubmission = async (req, res) => {
    try {
        const { score, feedback } = req.body;

        // Validate score
        if (
            score === undefined ||
            typeof score !== "number" ||
            score < 0 ||
            score > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Score must be between 0 and 100"
            });
        }

        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        // Submission must first be moved to pending_review
        if (submission.status !== "pending_review") {
            return res.status(400).json({
                success: false,
                message: "Submission must be pending review before scoring"
            });
        }

        submission.score = score;
        submission.feedback = feedback || "";
        submission.evaluatedBy = req.user._id;
        submission.status = "scored";

        await submission.save();

        res.status(200).json({
            success: true,
            message: "Submission scored successfully",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};