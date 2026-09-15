const User = require("../models/User");
const Assessment = require("../models/Assessment");
const Submission = require("../models/Submission");


// ADMIN: Get platform analytics
exports.getAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalInstructors,
            totalAdmins,
            activeUsers,
            blockedUsers,
            totalAssessments,
            pendingAssessments,
            approvedAssessments,
            rejectedAssessments,
            totalSubmissions,
            scoredSubmissions,
            pendingReviewSubmissions
        ] = await Promise.all([
            User.countDocuments(),

            User.countDocuments({
                role: "student"
            }),

            User.countDocuments({
                role: "instructor"
            }),

            User.countDocuments({
                role: "admin"
            }),

            User.countDocuments({
                isActive: true
            }),

            User.countDocuments({
                isActive: false
            }),

            Assessment.countDocuments(),

            Assessment.countDocuments({
                approvalStatus: "pending"
            }),

            Assessment.countDocuments({
                approvalStatus: "approved"
            }),

            Assessment.countDocuments({
                approvalStatus: "rejected"
            }),

            Submission.countDocuments(),

            Submission.countDocuments({
                status: "scored"
            }),

            Submission.countDocuments({
                status: "pending_review"
            })
        ]);

        // Calculate average score from scored submissions.
        const scoreStatistics =
            await Submission.aggregate([
                {
                    $match: {
                        status: "scored",
                        score: {
                            $ne: null
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageScore: {
                            $avg: "$score"
                        },
                        highestScore: {
                            $max: "$score"
                        },
                        lowestScore: {
                            $min: "$score"
                        }
                    }
                }
            ]);

        const scoreData =
            scoreStatistics.length > 0
                ? scoreStatistics[0]
                : {
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0
                };

        return res.status(200).json({
            success: true,

            analytics: {
                users: {
                    total: totalUsers,
                    students: totalStudents,
                    instructors: totalInstructors,
                    admins: totalAdmins,
                    active: activeUsers,
                    blocked: blockedUsers
                },

                assessments: {
                    total: totalAssessments,
                    pending: pendingAssessments,
                    approved: approvedAssessments,
                    rejected: rejectedAssessments
                },

                submissions: {
                    total: totalSubmissions,
                    scored: scoredSubmissions,
                    pendingReview:
                        pendingReviewSubmissions
                },

                scores: {
                    average:
                        Number(
                            scoreData.averageScore || 0
                        ).toFixed(2),

                    highest:
                        scoreData.highestScore || 0,

                    lowest:
                        scoreData.lowestScore || 0
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};