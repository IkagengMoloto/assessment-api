import { useEffect, useState } from "react";
import api from "../services/api";

function ScoreForm({
  submissionId,
  onScore,
}) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] =
    useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    onScore(
      submissionId,
      score,
      feedback
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "15px",
        padding: "15px",
        border: "1px solid #555",
        borderRadius: "6px",
      }}
    >
      <h4>Score Submission</h4>

      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <label>Score (%)</label>

        <input
          type="number"
          min="0"
          max="100"
          value={score}
          onChange={(event) =>
            setScore(event.target.value)
          }
          required
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <label>Feedback</label>

        <textarea
          value={feedback}
          onChange={(event) =>
            setFeedback(event.target.value)
          }
          rows="3"
          placeholder="Enter feedback for the student"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            fontFamily: "inherit",
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          padding: "9px 16px",
          cursor: "pointer",
        }}
      >
        Submit Score
      </button>
    </form>
  );
}
function InstructorDashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [questions, setQuestions] = useState([
    {
      questionText: "",
      type: "descriptive",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 10,
    },
  ]);

  const [performance, setPerformance] =
    useState([]);
  const [performanceLoading, setPerformanceLoading] =
    useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const loadPerformance = async () => {
    try {
      setPerformanceLoading(true);

      const response = await api.get(
        "/submissions/instructor/performance"
      );

      setPerformance(
        response.data.submissions || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load student performance."
      );
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  const addQuestion = () => {
    setQuestions((previousQuestions) => [
      ...previousQuestions,
      {
        questionText: "",
        type: "descriptive",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 10,
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      setError(
        "A question set must contain at least one question."
      );

  const handleStartReview = async (submissionId) => {
    try {
      setError("");
      setMessage("");

      await api.patch(
        `/submissions/instructor/${submissionId}/review`
      );

      setMessage(
        "Submission moved to pending review."
      );

      await loadPerformance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to start review."
      );
    }
  };

  const handleScoreSubmission = async (
    submissionId,
    score,
    feedback
  ) => {
    try {
      setError("");
      setMessage("");

      const numericScore = Number(score);

      if (
        Number.isNaN(numericScore) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        setError(
          "Score must be between 0 and 100."
        );
        return;
      }

      await api.patch(
        `/submissions/instructor/${submissionId}/score`,
        {
          score: numericScore,
          feedback: feedback.trim(),
        }
      );

      setMessage(
        "Submission scored successfully."
      );

      await loadPerformance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to score submission."
      );
    }
  };
      return;
    }

    setQuestions((previousQuestions) =>
      previousQuestions.filter(
        (_, questionIndex) =>
          questionIndex !== index
      )
    );

    setError("");
  };

  const updateQuestion = (
    index,
    field,
    value
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map(
        (question, questionIndex) => {
          if (questionIndex !== index) {
            return question;
          }

          if (field === "type") {
            return {
              ...question,
              type: value,
              options:
                value === "mcq"
                  ? question.options
                  : ["", "", "", ""],
              correctAnswer:
                value === "mcq"
                  ? question.correctAnswer
                  : "",
            };
          }

          return {
            ...question,
            [field]: value,
          };
        }
      )
    );
  };

  const updateOption = (
    questionIndex,
    optionIndex,
    value
  ) => {
    setQuestions((previousQuestions) =>
      previousQuestions.map(
        (question, currentQuestionIndex) => {
          if (
            currentQuestionIndex !==
            questionIndex
          ) {
            return question;
          }

          const updatedOptions = [
            ...question.options,
          ];

          updatedOptions[optionIndex] = value;

          return {
            ...question,
            options: updatedOptions,
          };
        }
      )
    );
  };

  const validateForm = () => {
    if (!title.trim()) {
      return "Question set title is required.";
    }

    if (questions.length === 0) {
      return "At least one question is required.";
    }

    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const question = questions[index];

      if (!question.questionText.trim()) {
        return `Question ${
          index + 1
        } requires question text.`;
      }

      if (
        !question.marks ||
        Number(question.marks) < 1
      ) {
        return `Question ${
          index + 1
        } must have at least 1 mark.`;
      }

      if (question.type === "mcq") {
        const validOptions =
          question.options.filter(
            (option) => option.trim() !== ""
          );

        if (validOptions.length < 2) {
          return `Question ${
            index + 1
          } requires at least two MCQ options.`;
        }

        if (!question.correctAnswer.trim()) {
          return `Question ${
            index + 1
          } requires a correct answer.`;
        }

        if (
          !validOptions.includes(
            question.correctAnswer.trim()
          )
        ) {
          return `The correct answer for Question ${
            index + 1
          } must match one of its options.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const formattedQuestions =
        questions.map((question) => ({
          questionText:
            question.questionText.trim(),
          type: question.type,
          options:
            question.type === "mcq"
              ? question.options
                  .map((option) =>
                    option.trim()
                  )
                  .filter(Boolean)
              : [],
          correctAnswer:
            question.type === "mcq"
              ? question.correctAnswer.trim()
              : "",
          marks: Number(question.marks),
        }));

      const response = await api.post(
        "/assessments",
        {
          title: title.trim(),
          description: description.trim(),
          questions: formattedQuestions,
        }
      );

      setMessage(
        response.data.message ||
          "Question set created successfully."
      );

      setTitle("");
      setDescription("");

      setQuestions([
        {
          questionText: "",
          type: "descriptive",
          options: ["", "", "", ""],
          correctAnswer: "",
          marks: 10,
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create question set."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const findQuestion = (
    submission,
    questionId
  ) => {
    return submission.assessment?.questions?.find(
      (question) =>
        question._id === questionId
    );
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1>Instructor Dashboard</h1>

      <p>
        Create interview preparation question
        sets and monitor student performance.
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

      <form onSubmit={handleSubmit}>
        <section
          style={{
            padding: "20px",
            border: "1px solid #666",
            borderRadius: "8px",
            marginBottom: "30px",
          }}
        >
          <h2>Question Set Details</h2>

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label htmlFor="title">
              Title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
              }}
            />
          </div>

          <div>
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
        </section>

        <h2>Questions</h2>

        {questions.map(
          (question, questionIndex) => (
            <section
              key={questionIndex}
              style={{
                padding: "20px",
                border: "1px solid #666",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h3>
                Question {questionIndex + 1}
              </h3>

              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <label>
                  Question Text
                </label>

                <textarea
                  value={
                    question.questionText
                  }
                  onChange={(event) =>
                    updateQuestion(
                      questionIndex,
                      "questionText",
                      event.target.value
                    )
                  }
                  required
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <label>
                  Question Type
                </label>

                <select
                  value={question.type}
                  onChange={(event) =>
                    updateQuestion(
                      questionIndex,
                      "type",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                  }}
                >
                  <option value="descriptive">
                    Descriptive
                  </option>

                  <option value="mcq">
                    Multiple Choice (MCQ)
                  </option>
                </select>
              </div>

              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <label>Marks</label>

                <input
                  type="number"
                  min="1"
                  value={question.marks}
                  onChange={(event) =>
                    updateQuestion(
                      questionIndex,
                      "marks",
                      event.target.value
                    )
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                  }}
                />
              </div>

              {question.type === "mcq" && (
                <div
                  style={{
                    padding: "15px",
                    border: "1px solid #555",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                >
                  <h3>MCQ Options</h3>

                  {question.options.map(
                    (
                      option,
                      optionIndex
                    ) => (
                      <div
                        key={optionIndex}
                        style={{
                          marginBottom:
                            "10px",
                        }}
                      >
                        <label>
                          Option{" "}
                          {optionIndex + 1}
                        </label>

                        <input
                          type="text"
                          value={option}
                          onChange={(
                            event
                          ) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              event.target
                                .value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                          }}
                        />
                      </div>
                    )
                  )}

                  <div
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <label>
                      Correct Answer
                    </label>

                    <select
                      value={
                        question.correctAnswer
                      }
                      onChange={(event) =>
                        updateQuestion(
                          questionIndex,
                          "correctAnswer",
                          event.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "5px",
                      }}
                    >
                      <option value="">
                        Select correct answer
                      </option>

                      {question.options
                        .filter(
                          (option) =>
                            option.trim() !==
                            ""
                        )
                        .map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <option
                              key={
                                optionIndex
                              }
                              value={option}
                            >
                              {option}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  removeQuestion(
                    questionIndex
                  )
                }
                style={{
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                Remove Question
              </button>
            </section>
          )
        )}

        <button
          type="button"
          onClick={addQuestion}
          style={{
            padding: "10px 18px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          Add Question
        </button>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 18px",
            cursor: submitting
              ? "not-allowed"
              : "pointer",
          }}
        >
          {submitting
            ? "Creating..."
            : "Create Question Set"}
        </button>
      </form>

      <section
        style={{
          marginTop: "55px",
          paddingTop: "30px",
          borderTop: "2px solid #666",
        }}
      >
        <h2>Student Performance</h2>

        <p>
          Review submissions for question sets
          you created.
        </p>

        <button
          type="button"
          onClick={loadPerformance}
          style={{
            padding: "8px 16px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          Refresh Performance
        </button>

        {performanceLoading ? (
          <p>
            Loading student performance...
          </p>
        ) : performance.length === 0 ? (
          <p>
            No student submissions are
            available yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {performance.map(
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
                    {
                      submission.assessment
                        ?.title
                    }
                  </h3>

                  <p>
                    <strong>
                      Student:
                    </strong>{" "}
                    {submission.student
                      ?.name ||
                      "Unknown student"}
                  </p>

                  <p>
                    <strong>
                      Email:
                    </strong>{" "}
                    {submission.student
                      ?.email || "N/A"}
                  </p>

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
                      : "Awaiting review"}
                  </p>

                  <h4>
                    Submitted Answers
                  </h4>

                  {submission.answers?.map(
                    (answer, index) => {
                      const question =
                        findQuestion(
                          submission,
                          answer.questionId
                        );

                      const isMcq =
                        question?.type ===
                        "mcq";

                      const isCorrect =
                        isMcq &&
                        answer.answer ===
                          question.correctAnswer;

                      return (
                        <div
                          key={
                            answer._id ||
                            index
                          }
                          style={{
                            padding:
                              "15px",
                            marginBottom:
                              "12px",
                            border:
                              "1px solid #555",
                            borderRadius:
                              "6px",
                          }}
                        >
                          <p>
                            <strong>
                              Question{" "}
                              {index + 1}:
                            </strong>{" "}
                            {question
                              ?.questionText ||
                              "Question unavailable"}
                          </p>

                          <p>
                            <strong>
                              Student Answer:
                            </strong>{" "}
                            {answer.answer}
                          </p>

                          {isMcq && (
                            <>
                              <p>
                                <strong>
                                  Correct
                                  Answer:
                                </strong>{" "}
                                {
                                  question.correctAnswer
                                }
                              </p>

                              <p>
                                <strong>
                                  MCQ Result:
                                </strong>{" "}
                                {isCorrect
                                  ? "Correct"
                                  : "Incorrect"}
                              </p>
                            </>
                          )}

                          <p>
                            <strong>
                              Marks:
                            </strong>{" "}
                            {question?.marks ??
                              "N/A"}
                          </p>
                        </div>
                      );
                    }
                  )}
                  {submission.status ===
                    "submitted" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStartReview(
                          submission._id
                        )
                      }
                      style={{
                        padding:
                          "9px 16px",
                        marginTop:
                          "10px",
                        cursor:
                          "pointer",
                      }}
                    >
                      Start Review
                    </button>
                  )}

                  {submission.status ===
                    "pending_review" && (
                    <ScoreForm
                      submissionId={
                        submission._id
                      }
                      onScore={
                        handleScoreSubmission
                      }
                    />
                  )}

                  {submission.status ===
                    "scored" && (
                    <div
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "12px",
                        border:
                          "1px solid #4caf50",
                        borderRadius:
                          "6px",
                      }}
                    >
                      <strong>
                        Assessment
                        completed and
                        scored.
                      </strong>
                    </div>
                  )}

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

export default InstructorDashboard;