const Submission = require("../models/Submission");
const Assessment = require("../models/Assessment");

// STUDENT: Submit an assessment
exports.submitAssessment = async (req, res) => {
    try {
        const { assessmentId, answers } = req.body;

        // Basic validation
        if (
            !assessmentId ||
            !answers ||
            !Array.isArray(answers) ||
            answers.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Assessment ID and answers are required"
            });
        }

        // Check that the assessment exists
        const assessment = await Assessment.findById(
            assessmentId
        );

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        // Students may only submit active, approved assessments
        if (
            !assessment.isActive ||
            assessment.approvalStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message: "This assessment is not available for submission"
            });
        }

        // Prevent the same student from submitting twice
        const existingSubmission =
            await Submission.findOne({
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
        if (
            answers.length !==
            assessment.questions.length
        ) {
            return res.status(400).json({
                success: false,
                message: "All assessment questions must be answered"
            });
        }

        // Get valid question IDs
        const validQuestionIds =
            assessment.questions.map(
                (question) =>
                    question._id.toString()
            );

        // Validate submitted question IDs
        const invalidAnswer = answers.find(
            (item) =>
                !item.questionId ||
                !validQuestionIds.includes(
                    item.questionId.toString()
                )
        );

        if (invalidAnswer) {
            return res.status(400).json({
                success: false,
                message: "One or more question IDs are invalid"
            });
        }

        // Check for duplicate question IDs
        const submittedQuestionIds =
            answers.map((item) =>
                item.questionId.toString()
            );

        const uniqueQuestionIds =
            new Set(submittedQuestionIds);

        if (
            uniqueQuestionIds.size !==
            submittedQuestionIds.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Duplicate question IDs are not allowed"
            });
        }

        // Check every answer contains text
        const emptyAnswer = answers.find(
            (item) =>
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

        // Clean submitted answers
        const cleanedAnswers = answers.map(
            (item) => ({
                questionId: item.questionId,
                answer: item.answer.trim()
            })
        );

        /*
         * Calculate MCQ marks on the SERVER.
         * correctAnswer is read directly from MongoDB,
         * not supplied by the student's browser.
         */
        let mcqEarnedMarks = 0;
        let mcqTotalMarks = 0;
        let hasDescriptiveQuestions = false;

        for (const question of assessment.questions) {
            if (question.type === "mcq") {
                mcqTotalMarks += question.marks;

                const submittedAnswer =
                    cleanedAnswers.find(
                        (item) =>
                            item.questionId.toString() ===
                            question._id.toString()
                    );

                if (
                    submittedAnswer &&
                    submittedAnswer.answer ===
                        question.correctAnswer
                ) {
                    mcqEarnedMarks += question.marks;
                }
            } else {
                hasDescriptiveQuestions = true;
            }
        }

        /*
         * If every question is MCQ, the backend can calculate
         * the final percentage immediately.
         *
         * If descriptive questions exist, final scoring remains
         * with the evaluator/instructor.
         */
        let automaticScore = null;
        let submissionStatus = "submitted";

        if (
            !hasDescriptiveQuestions &&
            mcqTotalMarks > 0
        ) {
            automaticScore = Math.round(
                (mcqEarnedMarks /
                    mcqTotalMarks) *
                    100
            );

            submissionStatus = "scored";
        }

        // Create submission
        const submission =
            await Submission.create({
                assessment: assessmentId,
                student: req.user._id,
                answers: cleanedAnswers,
                status: submissionStatus,
                score: automaticScore
            });

        res.status(201).json({
            success: true,
            message:
                submissionStatus === "scored"
                    ? "Assessment submitted and scored successfully"
                    : "Assessment submitted successfully and is awaiting review",
            mcqResult: {
                earnedMarks: mcqEarnedMarks,
                totalMarks: mcqTotalMarks
            },
            requiresManualReview:
                hasDescriptiveQuestions,
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
        const submissions =
            await Submission.find({
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


// EVALUATOR / INSTRUCTOR:
// View submissions waiting for evaluation
exports.getPendingSubmissions = async (
    req,
    res
) => {
    try {
        const submissions =
            await Submission.find({
                status: {
                    $in: [
                        "submitted",
                        "pending_review"
                    ]
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


// EVALUATOR / INSTRUCTOR:
// Move submission to pending review
exports.startReview = async (req, res) => {
    try {
        const submission =
            await Submission.findById(
                req.params.id
            );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        if (
            submission.status !== "submitted"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only submitted assessments can be moved to pending review"
            });
        }

        submission.status =
            "pending_review";

        await submission.save();

        res.status(200).json({
            success: true,
            message:
                "Submission moved to pending review",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EVALUATOR / INSTRUCTOR:
// Score a submission
exports.scoreSubmission = async (
    req,
    res
) => {
    try {
        const { score, feedback } = req.body;

        if (
            score === undefined ||
            typeof score !== "number" ||
            score < 0 ||
            score > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Score must be between 0 and 100"
            });
        }

        const submission =
            await Submission.findById(
                req.params.id
            );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        if (
            submission.status !==
            "pending_review"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Submission must be pending review before scoring"
            });
        }

        submission.score = score;
        submission.feedback =
            feedback || "";
        submission.evaluatedBy =
            req.user._id;
        submission.status = "scored";

        await submission.save();

        res.status(200).json({
            success: true,
            message:
                "Submission scored successfully",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// INSTRUCTOR: View student performance for own assessments
exports.getInstructorPerformance = async (req, res) => {
    try {
        // Find assessments created by this instructor
        const instructorAssessments =
            await Assessment.find({
                createdBy: req.user._id
            }).select("_id title description");

        const assessmentIds =
            instructorAssessments.map(
                (assessment) => assessment._id
            );

        // Find submissions belonging only to those assessments
        const submissions =
            await Submission.find({
                assessment: {
                    $in: assessmentIds
                }
            })
                .populate(
                    "student",
                    "name email"
                )
                .populate(
                    "assessment",
                    "title description questions"
                )
                .populate(
                    "evaluatedBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json({
            success: true,
            assessmentCount:
                instructorAssessments.length,
            submissionCount:
                submissions.length,
            submissions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// INSTRUCTOR: Start review for a submission
// belonging to one of their own assessments
exports.startInstructorReview = async (req, res) => {
    try {
        const submission = await Submission.findById(
            req.params.id
        ).populate("assessment");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        // Security: instructor must own the assessment
        if (
            !submission.assessment ||
            submission.assessment.createdBy.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to review this submission"
            });
        }

        if (submission.status !== "submitted") {
            return res.status(400).json({
                success: false,
                message:
                    "Only submitted assessments can be moved to pending review"
            });
        }

        submission.status = "pending_review";

        await submission.save();

        res.status(200).json({
            success: true,
            message:
                "Submission moved to pending review",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// INSTRUCTOR: Score a submission belonging
// to one of their own assessments
exports.scoreInstructorSubmission = async (
    req,
    res
) => {
    try {
        const { score, feedback } = req.body;

        if (
            score === undefined ||
            typeof score !== "number" ||
            score < 0 ||
            score > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Score must be between 0 and 100"
            });
        }

        const submission = await Submission.findById(
            req.params.id
        ).populate("assessment");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        // Security: instructor must own the assessment
        if (
            !submission.assessment ||
            submission.assessment.createdBy.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to score this submission"
            });
        }

        if (
            submission.status !==
            "pending_review"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Submission must be pending review before scoring"
            });
        }

        submission.score = score;
        submission.feedback =
            typeof feedback === "string"
                ? feedback.trim()
                : "";

        submission.evaluatedBy =
            req.user._id;

        submission.status = "scored";

        await submission.save();

        res.status(200).json({
            success: true,
            message:
                "Submission scored successfully",
            submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};