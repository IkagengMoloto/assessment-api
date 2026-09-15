const Assessment = require("../models/Assessment");

// ADMIN / INSTRUCTOR: Create a new assessment
exports.createAssessment = async (req, res) => {
    try {
        const { title, description, questions } = req.body;

        // Validate title
        if (
            !title ||
            typeof title !== "string" ||
            title.trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Assessment title is required"
            });
        }

        // Validate questions array
        if (
            !questions ||
            !Array.isArray(questions) ||
            questions.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one question is required"
            });
        }

        // Validate every question
        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];

            if (
                !question.questionText ||
                typeof question.questionText !== "string" ||
                question.questionText.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${index + 1} must contain questionText`
                });
            }

            if (
                question.marks === undefined ||
                typeof question.marks !== "number" ||
                question.marks < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${index + 1} must have marks greater than 0`
                });
            }

            const questionType =
                question.type || "descriptive";

            if (
                !["mcq", "descriptive"].includes(questionType)
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${index + 1} has an invalid question type`
                });
            }

            // Additional validation for MCQ questions
            if (questionType === "mcq") {
                if (
                    !Array.isArray(question.options) ||
                    question.options.length < 2
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${index + 1} must contain at least two MCQ options`
                    });
                }

                const cleanedOptions = question.options
                    .filter(
                        (option) =>
                            typeof option === "string" &&
                            option.trim() !== ""
                    )
                    .map((option) => option.trim());

                if (cleanedOptions.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${index + 1} must contain at least two valid MCQ options`
                    });
                }

                if (
                    !question.correctAnswer ||
                    typeof question.correctAnswer !== "string" ||
                    question.correctAnswer.trim() === ""
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${index + 1} must contain a correct answer`
                    });
                }

                if (
                    !cleanedOptions.includes(
                        question.correctAnswer.trim()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${index + 1} correct answer must match one of the MCQ options`
                    });
                }

                question.options = cleanedOptions;
                question.correctAnswer =
                    question.correctAnswer.trim();
            } else {
                // Descriptive questions do not need MCQ data
                question.options = [];
                question.correctAnswer = "";
            }

            question.type = questionType;
            question.questionText =
                question.questionText.trim();
        }

        // Calculate total marks
        const totalMarks = questions.reduce(
            (total, question) =>
                total + question.marks,
            0
        );

        /*
         * Instructor-created content requires Admin approval.
         * Admin-created content is approved immediately.
         */
        const approvalStatus =
            req.user.role === "instructor"
                ? "pending"
                : "approved";

        const assessment = await Assessment.create({
            title: title.trim(),
            description:
                typeof description === "string"
                    ? description.trim()
                    : "",
            questions,
            createdBy: req.user._id,
            approvalStatus
        });

        res.status(201).json({
            success: true,
            message:
                approvalStatus === "pending"
                    ? "Assessment created successfully and is pending admin approval"
                    : "Assessment created successfully",
            totalMarks,
            assessment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// AUTHENTICATED USERS: View assessments
exports.getAssessments = async (req, res) => {
    try {
        /*
         * Students only receive active, approved assessments.
         * Other authenticated roles can see active assessments
         * regardless of approval status.
         */
        const filter = {
            isActive: true
        };

        if (req.user.role === "student") {
            filter.approvalStatus = "approved";
        }

        const assessments = await Assessment.find(filter)
            .populate(
                "createdBy",
                "name email role"
            )
            .sort({
                createdAt: -1
            });

        /*
         * Never expose correct answers to students.
         */
        const safeAssessments = assessments.map(
            (assessment) => {
                const data =
                    assessment.toObject();

                if (req.user.role === "student") {
                    data.questions =
                        data.questions.map(
                            (question) => {
                                delete question.correctAnswer;
                                return question;
                            }
                        );
                }

                return data;
            }
        );

        res.status(200).json({
            success: true,
            count: safeAssessments.length,
            assessments: safeAssessments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// AUTHENTICATED USERS: View one assessment
exports.getAssessmentById = async (req, res) => {
    try {
        const assessment =
            await Assessment.findById(
                req.params.id
            ).populate(
                "createdBy",
                "name email role"
            );

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        /*
         * Students cannot access inactive or
         * unapproved assessments.
         */
        if (
            req.user.role === "student" &&
            (
                !assessment.isActive ||
                assessment.approvalStatus !== "approved"
            )
        ) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        const assessmentData =
            assessment.toObject();

        /*
         * Hide correct answers from students.
         */
        if (req.user.role === "student") {
            assessmentData.questions =
                assessmentData.questions.map(
                    (question) => {
                        delete question.correctAnswer;
                        return question;
                    }
                );
        }

        res.status(200).json({
            success: true,
            assessment: assessmentData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};