import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import api from "./services/api";

import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function LoginPage({ user, setUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === "student") {
      navigate("/student");
    } else if (user.role === "admin") {
      navigate("/admin");
    } else if (
      user.role === "instructor" ||
      user.role === "evaluator"
    ) {
      navigate("/instructor");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setMessage("Logging in...");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const loggedInUser = response.data.user;
      const token = response.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
      setMessage("Login successful");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h1>Interview Preparation Platform</h1>

      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            style={{
              width: "100%",
              padding: "10px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            style={{
              width: "100%",
              padding: "10px",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </div>
  );
}

function ProtectedRoute({
  user,
  allowedRoles,
  children,
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const [user, setUser] = useState(() => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            user.role === "student" ? (
              <Navigate to="/student" replace />
            ) : user.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate
                to="/instructor"
                replace
              />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage
            user={user}
            setUser={setUser}
          />
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["student"]}
          >
            <div>
              <StudentDashboard />

              <div
                style={{
                  padding: "0 40px 40px",
                }}
              >
                <button
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor"
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={[
              "instructor",
              "evaluator",
            ]}
          >
            <div>
              <InstructorDashboard />

              <div
                style={{
                  padding: "0 40px 40px",
                }}
              >
                <button
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["admin"]}
          >
            <div>
              <AdminDashboard />

              <div
                style={{
                  padding: "0 40px 40px",
                }}
              >
                <button
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;