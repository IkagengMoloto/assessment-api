const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        questionText: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["mcq", "descriptive"],
            default: "descriptive"
        },

        options: {
            type: [String],
            default: []
        },

        correctAnswer: {
            type: String,
            trim: true,
            default: ""
        },

        marks: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: true
    }
);

const assessmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        questions: {
            type: [questionSchema],
            validate: {
                validator: function (questions) {
                    return questions.length > 0;
                },
                message: "Assessment must contain at least one question"
            }
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Assessment",
    assessmentSchema
);