const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    answer: {
        type: String,
        required: true,
        trim: true
    }
});

const submissionSchema = new mongoose.Schema(
    {
        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        answers: [answerSchema],

        status: {
            type: String,
            enum: [
                "submitted",
                "pending_review",
                "scored"
            ],
            default: "submitted"
        },

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        feedback: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Prevent one student from submitting
// the same assessment more than once
submissionSchema.index(
    {
        assessment: 1,
        student: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Submission",
    submissionSchema
);