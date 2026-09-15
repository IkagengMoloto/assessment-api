import { useEffect, useState } from "react";
import api from "../services/api";

function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingAssessments, setPendingAssessments] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "student"
    });

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                analyticsResponse,
                usersResponse,
                pendingResponse
            ] = await Promise.all([
                api.get("/admin/analytics"),
                api.get("/users"),
                api.get("/assessments/admin/pending")
            ]);

            setAnalytics(
                analyticsResponse.data.analytics
            );

            setUsers(
                usersResponse.data.users || []
            );

            setPendingAssessments(
                pendingResponse.data.assessments || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load Admin Dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleUserInput = (event) => {
        const { name, value } = event.target;

        setNewUser((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleCreateUser = async (event) => {
        event.preventDefault();

        try {
            setMessage("");
            setError("");

            const response = await api.post(
                "/users",
                newUser
            );

            setMessage(
                response.data.message ||
                "User created successfully."
            );

            setNewUser({
                name: "",
                email: "",
                password: "",
                role: "student"
            });

            await loadDashboard();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create user."
            );
        }
    };

    const handleUserStatus = async (
        userId,
        currentStatus
    ) => {
        try {
            setMessage("");
            setError("");

            const response = await api.patch(
                `/users/${userId}/status`,
                {
                    isActive: !currentStatus
                }
            );

            setMessage(
                response.data.message
            );

            await loadDashboard();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update user status."
            );
        }
    };

    const handleApproval = async (
        assessmentId,
        approvalStatus
    ) => {
        try {
            setMessage("");
            setError("");

            const response = await api.patch(
                `/assessments/${assessmentId}/approval`,
                {
                    approvalStatus
                }
            );

            setMessage(
                response.data.message
            );

            await loadDashboard();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update assessment approval."
            );
        }
    };

    const cardStyle = {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "18px",
        minWidth: "150px",
        flex: "1"
    };

    const sectionStyle = {
        marginTop: "35px",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "10px"
    };

    const buttonStyle = {
        padding: "8px 14px",
        cursor: "pointer",
        marginRight: "8px"
    };

    if (loading) {
        return (
            <div style={{ padding: "40px" }}>
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    return (
        <div
            style={{
                padding: "40px",
                maxWidth: "1200px",
                margin: "0 auto"
            }}
        >
            <h1>Admin Dashboard</h1>

            <p>
                Manage platform users, approve instructor
                content and monitor platform performance.
            </p>

            {message && (
                <div
                    style={{
                        background: "#e8f5e9",
                        padding: "12px",
                        marginTop: "15px",
                        borderRadius: "6px"
                    }}
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    style={{
                        background: "#ffebee",
                        padding: "12px",
                        marginTop: "15px",
                        borderRadius: "6px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* PLATFORM ANALYTICS */}

            <section style={sectionStyle}>
                <h2>Platform Analytics</h2>

                {analytics && (
                    <>
                        <h3>Users</h3>

                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                flexWrap: "wrap"
                            }}
                        >
                            <div style={cardStyle}>
                                <strong>Total Users</strong>
                                <h2>
                                    {analytics.users.total}
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Students</strong>
                                <h2>
                                    {analytics.users.students}
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Instructors</strong>
                                <h2>
                                    {analytics.users.instructors}
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Active Users</strong>
                                <h2>
                                    {analytics.users.active}
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Blocked Users</strong>
                                <h2>
                                    {analytics.users.blocked}
                                </h2>
                            </div>
                        </div>

                        <h3 style={{ marginTop: "25px" }}>
                            Assessments
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                flexWrap: "wrap"
                            }}
                        >
                            <div style={cardStyle}>
                                <strong>
                                    Total Assessments
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .assessments
                                            .total
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Pending Approval
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .assessments
                                            .pending
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Approved</strong>
                                <h2>
                                    {
                                        analytics
                                            .assessments
                                            .approved
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>Rejected</strong>
                                <h2>
                                    {
                                        analytics
                                            .assessments
                                            .rejected
                                    }
                                </h2>
                            </div>
                        </div>

                        <h3 style={{ marginTop: "25px" }}>
                            Submissions & Scores
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                flexWrap: "wrap"
                            }}
                        >
                            <div style={cardStyle}>
                                <strong>
                                    Total Submissions
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .submissions
                                            .total
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Scored Submissions
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .submissions
                                            .scored
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Pending Review
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .submissions
                                            .pendingReview
                                    }
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Average Score
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .scores
                                            .average
                                    }
                                    %
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Highest Score
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .scores
                                            .highest
                                    }
                                    %
                                </h2>
                            </div>

                            <div style={cardStyle}>
                                <strong>
                                    Lowest Score
                                </strong>
                                <h2>
                                    {
                                        analytics
                                            .scores
                                            .lowest
                                    }
                                    %
                                </h2>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* CREATE USER */}

            <section style={sectionStyle}>
                <h2>Create User</h2>

                <form onSubmit={handleCreateUser}>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Name</label>
                        <br />

                        <input
                            type="text"
                            name="name"
                            value={newUser.name}
                            onChange={handleUserInput}
                            required
                            style={{
                                padding: "9px",
                                width: "100%",
                                maxWidth: "500px"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                        <label>Email</label>
                        <br />

                        <input
                            type="email"
                            name="email"
                            value={newUser.email}
                            onChange={handleUserInput}
                            required
                            style={{
                                padding: "9px",
                                width: "100%",
                                maxWidth: "500px"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                        <label>Password</label>
                        <br />

                        <input
                            type="password"
                            name="password"
                            value={newUser.password}
                            onChange={handleUserInput}
                            required
                            minLength="6"
                            style={{
                                padding: "9px",
                                width: "100%",
                                maxWidth: "500px"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <label>Role</label>
                        <br />

                        <select
                            name="role"
                            value={newUser.role}
                            onChange={handleUserInput}
                            style={{
                                padding: "9px",
                                width: "250px"
                            }}
                        >
                            <option value="student">
                                Student
                            </option>

                            <option value="instructor">
                                Instructor
                            </option>

                            <option value="evaluator">
                                Evaluator
                            </option>

                            <option value="admin">
                                Admin
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        style={buttonStyle}
                    >
                        Create User
                    </button>
                </form>
            </section>

            {/* USER MANAGEMENT */}

            <section style={sectionStyle}>
                <h2>User Management</h2>

                {users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse"
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "10px",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >
                                        Name
                                    </th>

                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "10px",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >
                                        Email
                                    </th>

                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "10px",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >
                                        Role
                                    </th>

                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "10px",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >
                                        Status
                                    </th>

                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "10px",
                                            borderBottom:
                                                "1px solid #ddd"
                                        }}
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td
                                            style={{
                                                padding: "10px"
                                            }}
                                        >
                                            {user.name}
                                        </td>

                                        <td
                                            style={{
                                                padding: "10px"
                                            }}
                                        >
                                            {user.email}
                                        </td>

                                        <td
                                            style={{
                                                padding: "10px"
                                            }}
                                        >
                                            {user.role}
                                        </td>

                                        <td
                                            style={{
                                                padding: "10px"
                                            }}
                                        >
                                            {user.isActive === false
                                                ? "Blocked"
                                                : "Active"}
                                        </td>

                                        <td
                                            style={{
                                                padding: "10px"
                                            }}
                                        >
                                            <button
                                                type="button"
                                                style={
                                                    buttonStyle
                                                }
                                                onClick={() =>
                                                    handleUserStatus(
                                                        user._id,
                                                        user.isActive !==
                                                            false
                                                    )
                                                }
                                            >
                                                {user.isActive ===
                                                false
                                                    ? "Activate"
                                                    : "Block"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* CONTENT APPROVAL */}

            <section style={sectionStyle}>
                <h2>Content Approval</h2>

                {pendingAssessments.length === 0 ? (
                    <p>
                        No assessments are currently
                        waiting for approval.
                    </p>
                ) : (
                    pendingAssessments.map(
                        (assessment) => (
                            <div
                                key={assessment._id}
                                style={{
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "8px",
                                    padding: "18px",
                                    marginBottom: "15px"
                                }}
                            >
                                <h3>
                                    {assessment.title}
                                </h3>

                                <p>
                                    {assessment.description}
                                </p>

                                <p>
                                    <strong>
                                        Created by:
                                    </strong>{" "}
                                    {assessment.createdBy
                                        ?.name ||
                                        "Unknown"}
                                </p>

                                <p>
                                    <strong>
                                        Instructor email:
                                    </strong>{" "}
                                    {assessment.createdBy
                                        ?.email ||
                                        "Unknown"}
                                </p>

                                <p>
                                    <strong>
                                        Questions:
                                    </strong>{" "}
                                    {
                                        assessment.questions
                                            ?.length
                                    }
                                </p>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {
                                        assessment.approvalStatus
                                    }
                                </p>

                                <button
                                    type="button"
                                    style={buttonStyle}
                                    onClick={() =>
                                        handleApproval(
                                            assessment._id,
                                            "approved"
                                        )
                                    }
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    style={buttonStyle}
                                    onClick={() =>
                                        handleApproval(
                                            assessment._id,
                                            "rejected"
                                        )
                                    }
                                >
                                    Reject
                                </button>
                            </div>
                        )
                    )
                )}
            </section>
        </div>
    );
}

export default AdminDashboard;
