const Assessment = require("../models/Assessment");

// ADMIN: Create a new assessment
exports.createAssessment = async (req, res) => {
    try {
        const { title, description, questions } = req.body;

        // Validate title
        if (!title || typeof title !== "string" || title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Assessment title is required"
            });
        }

        // Validate questions array
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one question is required"
            });
        }

        // Validate every question
        for (const question of questions) {
            if (
                !question.questionText ||
                typeof question.questionText !== "string" ||
                question.questionText.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Every question must contain questionText"
                });
            }

            if (
                question.marks === undefined ||
                typeof question.marks !== "number" ||
                question.marks < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Every question must have marks greater than 0"
                });
            }
        }

        // Calculate total marks
        const totalMarks = questions.reduce(
            (total, question) => total + question.marks,
            0
        );

        const assessment = await Assessment.create({
            title: title.trim(),
            description: description || "",
            questions,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: "Assessment created successfully",
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


// AUTHENTICATED USERS: View all active assessments
exports.getAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({
            isActive: true
        })
            .populate(
                "createdBy",
                "name email role"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            count: assessments.length,
            assessments
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
        const assessment = await Assessment.findById(
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

        res.status(200).json({
            success: true,
            assessment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};