const Assessment = require("../models/Assessment");


// ADMIN / INSTRUCTOR: Create a new assessment
exports.createAssessment = async (req, res) => {
    try {
        const { title, description, questions } = req.body;

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

        for (
            let index = 0;
            index < questions.length;
            index++
        ) {
            const question = questions[index];

            if (
                !question.questionText ||
                typeof question.questionText !== "string" ||
                question.questionText.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Question ${index + 1} must contain questionText`
                });
            }

            if (
                question.marks === undefined ||
                typeof question.marks !== "number" ||
                question.marks < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Question ${index + 1} must have marks greater than 0`
                });
            }

            const questionType =
                question.type || "descriptive";

            if (
                !["mcq", "descriptive"].includes(
                    questionType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Question ${index + 1} has an invalid question type`
                });
            }

            if (questionType === "mcq") {
                if (
                    !Array.isArray(question.options) ||
                    question.options.length < 2
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Question ${index + 1} must contain at least two MCQ options`
                    });
                }

                const cleanedOptions =
                    question.options
                        .filter(
                            (option) =>
                                typeof option === "string" &&
                                option.trim() !== ""
                        )
                        .map(
                            (option) =>
                                option.trim()
                        );

                if (cleanedOptions.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Question ${index + 1} must contain at least two valid MCQ options`
                    });
                }

                if (
                    !question.correctAnswer ||
                    typeof question.correctAnswer !== "string" ||
                    question.correctAnswer.trim() === ""
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Question ${index + 1} must contain a correct answer`
                    });
                }

                if (
                    !cleanedOptions.includes(
                        question.correctAnswer.trim()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Question ${index + 1} correct answer must match one of the MCQ options`
                    });
                }

                question.options =
                    cleanedOptions;

                question.correctAnswer =
                    question.correctAnswer.trim();

            } else {
                question.options = [];
                question.correctAnswer = "";
            }

            question.type = questionType;

            question.questionText =
                question.questionText.trim();
        }

        const totalMarks =
            questions.reduce(
                (total, question) =>
                    total + question.marks,
                0
            );

        // Instructor content requires admin approval.
        // Admin-created content is immediately approved.
        const approvalStatus =
            req.user.role === "instructor"
                ? "pending"
                : "approved";

        const assessment =
            await Assessment.create({
                title: title.trim(),

                description:
                    typeof description === "string"
                        ? description.trim()
                        : "",

                questions,

                createdBy: req.user._id,

                approvalStatus
            });

        return res.status(201).json({
            success: true,

            message:
                approvalStatus === "pending"
                    ? "Assessment created successfully and is pending admin approval"
                    : "Assessment created successfully",

            totalMarks,

            assessment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// AUTHENTICATED USERS: View assessments
exports.getAssessments = async (req, res) => {
    try {
        const filter = {
            isActive: true
        };

        // Students can only see approved content.
        if (req.user.role === "student") {
            filter.approvalStatus = "approved";
        }

        const assessments =
            await Assessment.find(filter)
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        // Never expose correct answers to students.
        const safeAssessments =
            assessments.map(
                (assessment) => {
                    const data =
                        assessment.toObject();

                    if (
                        req.user.role === "student"
                    ) {
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

        return res.status(200).json({
            success: true,
            count: safeAssessments.length,
            assessments: safeAssessments
        });

    } catch (error) {
        return res.status(500).json({
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

        // Students cannot directly access
        // inactive or unapproved assessments.
        if (
            req.user.role === "student" &&
            (
                !assessment.isActive ||
                assessment.approvalStatus !==
                    "approved"
            )
        ) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        const assessmentData =
            assessment.toObject();

        if (req.user.role === "student") {
            assessmentData.questions =
                assessmentData.questions.map(
                    (question) => {
                        delete question.correctAnswer;
                        return question;
                    }
                );
        }

        return res.status(200).json({
            success: true,
            assessment: assessmentData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ADMIN: View assessments waiting for approval
exports.getPendingAssessments = async (
    req,
    res
) => {
    try {
        const assessments =
            await Assessment.find({
                approvalStatus: "pending",
                isActive: true
            })
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: assessments.length,
            assessments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ADMIN: Approve or reject an assessment
exports.updateAssessmentApproval = async (
    req,
    res
) => {
    try {
        const { approvalStatus } = req.body;

        if (
            !approvalStatus ||
            !["approved", "rejected"].includes(
                approvalStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "approvalStatus must be approved or rejected"
            });
        }

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

        assessment.approvalStatus =
            approvalStatus;

        await assessment.save();

        return res.status(200).json({
            success: true,

            message:
                approvalStatus === "approved"
                    ? "Assessment approved successfully"
                    : "Assessment rejected successfully",

            assessment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};