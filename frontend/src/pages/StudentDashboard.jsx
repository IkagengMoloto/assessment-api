import { useEffect, useState } from "react";
import api from "../services/api";

function StudentDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assessmentResponse,
        submissionResponse,
      ] = await Promise.all([
        api.get("/assessments"),
        api.get("/submissions/my"),
      ]);

      setAssessments(
        assessmentResponse.data.assessments || []
      );

      setSubmissions(
        submissionResponse.data.submissions || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load student dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const hasSubmitted = (assessmentId) => {
    return submissions.some(
      (submission) =>
        submission.assessment?._id === assessmentId
    );
  };

  const startAssessment = async (assessmentId) => {
    try {
      setError("");
      setMessage("");

      if (hasSubmitted(assessmentId)) {
        setError(
          "You have already submitted this assessment."
        );
        return;
      }

      const response = await api.get(
        `/assessments/${assessmentId}`
      );

      const assessment = response.data.assessment;

      setSelectedAssessment(assessment);

      const initialAnswers = {};

      assessment.questions.forEach((question) => {
        initialAnswers[question._id] = "";
      });

      setAnswers(initialAnswers);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to open the assessment."
      );
    }
  };

  const handleAnswerChange = (
    questionId,
    answer
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));
  };

  const closeAssessment = () => {
    setSelectedAssessment(null);
    setAnswers({});
    setError("");
    setMessage("");
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const unansweredQuestion =
        selectedAssessment.questions.find(
          (question) =>
            !answers[question._id] ||
            answers[question._id].trim() === ""
        );

      if (unansweredQuestion) {
        setError(
          "Please answer all questions before submitting."
        );
        return;
      }

      const formattedAnswers =
        selectedAssessment.questions.map(
          (question) => ({
            questionId: question._id,
            answer:
              answers[question._id].trim(),
          })
        );

      await api.post("/submissions", {
        assessmentId: selectedAssessment._id,
        answers: formattedAnswers,
      });

      setMessage(
        "Assessment submitted successfully."
      );

      await loadStudentData();

      setSelectedAssessment(null);
      setAnswers({});

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit the assessment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Student Dashboard</h1>
        <p>Loading assessments...</p>
      </div>
    );
  }

  if (selectedAssessment) {
    return (
      <div
        style={{
          padding: "40px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={closeAssessment}
          style={{
            padding: "8px 16px",
            marginBottom: "25px",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>

        <h1>{selectedAssessment.title}</h1>

        <p>
          {selectedAssessment.description}
        </p>

        <p>
          <strong>Total Questions:</strong>{" "}
          {selectedAssessment.questions.length}
        </p>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              border: "1px solid #d9534f",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAssessment}>
          {selectedAssessment.questions.map(
            (question, index) => (
              <div
                key={question._id}
                style={{
                  marginBottom: "25px",
                  padding: "20px",
                  border: "1px solid #666",
                  borderRadius: "8px",
                }}
              >
                <h3>
                  Question {index + 1}
                </h3>

                <p>{question.questionText}</p>

                <p>
                  <strong>Type:</strong>{" "}
                  {question.type === "mcq"
                    ? "Multiple Choice"
                    : "Descriptive"}
                </p>

                <p>
                  <strong>Marks:</strong>{" "}
                  {question.marks}
                </p>

                {question.type === "mcq" ? (
                  <div>
                    <p>
                      <strong>
                        Select one answer:
                      </strong>
                    </p>

                    {question.options?.map(
                      (option, optionIndex) => {
                        const optionId =
                          `question-${question._id}-option-${optionIndex}`;

                        return (
                          <div
                            key={optionIndex}
                            style={{
                              marginBottom:
                                "12px",
                              padding: "10px",
                              border:
                                "1px solid #555",
                              borderRadius:
                                "6px",
                            }}
                          >
                            <label
                              htmlFor={
                                optionId
                              }
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "10px",
                                cursor:
                                  "pointer",
                                marginBottom:
                                  0,
                              }}
                            >
                              <input
                                id={optionId}
                                type="radio"
                                name={`question-${question._id}`}
                                value={option}
                                checked={
                                  answers[
                                    question
                                      ._id
                                  ] === option
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleAnswerChange(
                                    question._id,
                                    e.target
                                      .value
                                  )
                                }
                                required
                              />

                              <span>
                                {option}
                              </span>
                            </label>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor={`answer-${question._id}`}
                    >
                      Your Answer
                    </label>

                    <textarea
                      id={`answer-${question._id}`}
                      value={
                        answers[
                          question._id
                        ] || ""
                      }
                      onChange={(e) =>
                        handleAnswerChange(
                          question._id,
                          e.target.value
                        )
                      }
                      required
                      rows="5"
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "8px",
                        fontFamily:
                          "inherit",
                        fontSize: "1rem",
                        resize: "vertical",
                      }}
                    />
                  </div>
                )}
              </div>
            )
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 20px",
              cursor: submitting
                ? "not-allowed"
                : "pointer",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit Assessment"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1>Student Dashboard</h1>

      <p>
        View available interview assessments,
        complete questions, and track your results.
      </p>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #4caf50",
            borderRadius: "6px",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #d9534f",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      <section style={{ marginTop: "35px" }}>
        <h2>Available Question Sets</h2>

        {assessments.length === 0 ? (
          <p>
            No assessments are currently available.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "15px",
            }}
          >
            {assessments.map((assessment) => {
              const submitted =
                hasSubmitted(assessment._id);

              return (
                <div
                  key={assessment._id}
                  style={{
                    padding: "20px",
                    border: "1px solid #666",
                    borderRadius: "8px",
                  }}
                >
                  <h3>
                    {assessment.title}
                  </h3>

                  <p>
                    {assessment.description ||
                      "No description provided."}
                  </p>

                  <p>
                    <strong>
                      Questions:
                    </strong>{" "}
                    {assessment.questions
                      ?.length || 0}
                  </p>

                  <p>
                    <strong>
                      Created by:
                    </strong>{" "}
                    {assessment.createdBy
                      ?.name ||
                      "Instructor"}
                  </p>

                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      startAssessment(
                        assessment._id
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      cursor: submitted
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {submitted
                      ? "Already Submitted"
                      : "Start Assessment"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: "45px" }}>
        <h2>My Results</h2>

        {submissions.length === 0 ? (
          <p>
            You have not submitted any
            assessments yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "15px",
            }}
          >
            {submissions.map(
              (submission) => (
                <div
                  key={submission._id}
                  style={{
                    padding: "20px",
                    border:
                      "1px solid #666",
                    borderRadius: "8px",
                  }}
                >
                  <h3>
                    {submission.assessment
                      ?.title ||
                      "Assessment"}
                  </h3>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {submission.status}
                  </p>

                  <p>
                    <strong>
                      Score:
                    </strong>{" "}
                    {submission.score !==
                      null &&
                    submission.score !==
                      undefined
                      ? `${submission.score}%`
                      : "Not scored yet"}
                  </p>

                  {submission.feedback && (
                    <p>
                      <strong>
                        Feedback:
                      </strong>{" "}
                      {
                        submission.feedback
                      }
                    </p>
                  )}

                  {submission.evaluatedBy && (
                    <p>
                      <strong>
                        Reviewed by:
                      </strong>{" "}
                      {
                        submission
                          .evaluatedBy.name
                      }
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default StudentDashboard;