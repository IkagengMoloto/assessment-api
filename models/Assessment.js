const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        questionText: {
            type: String,
            required: true,
            trim: true
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